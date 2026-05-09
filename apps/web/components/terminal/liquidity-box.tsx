"use client";

import { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { demoSwapRouterAbi, erc20Abi, getDemoDexAddresses } from "@dex-terminal/blockchain";

const addresses = getDemoDexAddresses({
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_DEMO_WETH_ADDRESS: process.env.NEXT_PUBLIC_DEMO_WETH_ADDRESS,
  NEXT_PUBLIC_DEMO_USDC_ADDRESS: process.env.NEXT_PUBLIC_DEMO_USDC_ADDRESS,
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS,
});

function explorerTxUrl(hash: string) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

function parseAmount(value: string) {
  try {
    return parseUnits(value || "0", 18);
  } catch {
    return 0n;
  }
}

export function LiquidityBox() {
  const { address, isConnected } = useAccount();
  const [amount0, setAmount0] = useState("0.01");
  const [amount1, setAmount1] = useState("30");
  const [removeShares, setRemoveShares] = useState("0");
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const ready =
    addresses.demoWeth !== undefined &&
    addresses.demoUsdc !== undefined &&
    addresses.demoSwapRouter !== undefined;
  const parsed0 = useMemo(() => parseAmount(amount0), [amount0]);
  const parsed1 = useMemo(() => parseAmount(amount1), [amount1]);
  const parsedShares = useMemo(() => parseAmount(removeShares), [removeShares]);

  const lpBalance = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "balanceOf",
    args: address !== undefined ? [address] : undefined,
    query: { enabled: ready && address !== undefined },
  });
  const reserve0 = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "reserve0",
    query: { enabled: ready },
  });
  const reserve1 = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "reserve1",
    query: { enabled: ready },
  });

  async function approveBoth() {
    if (!ready || addresses.demoWeth === undefined || addresses.demoUsdc === undefined || addresses.demoSwapRouter === undefined) {
      return;
    }

    if (parsed0 > 0n) {
      await writeContractAsync({
        abi: erc20Abi,
        address: addresses.demoWeth,
        functionName: "approve",
        args: [addresses.demoSwapRouter, parsed0],
      });
    }
    if (parsed1 > 0n) {
      await writeContractAsync({
        abi: erc20Abi,
        address: addresses.demoUsdc,
        functionName: "approve",
        args: [addresses.demoSwapRouter, parsed1],
      });
    }
  }

  async function addLiquidity() {
    if (!ready || address === undefined || addresses.demoSwapRouter === undefined) {
      return;
    }

    await writeContractAsync({
      abi: demoSwapRouterAbi,
      address: addresses.demoSwapRouter,
      functionName: "addLiquidity",
      args: [parsed0, parsed1, address],
    });
  }

  async function removeLiquidity() {
    if (!ready || address === undefined || addresses.demoSwapRouter === undefined || parsedShares <= 0n) {
      return;
    }

    await writeContractAsync({
      abi: demoSwapRouterAbi,
      address: addresses.demoSwapRouter,
      functionName: "removeLiquidity",
      args: [parsedShares, 0n, 0n, address],
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Your LP position</h3>
        <dl className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">LP shares</dt>
            <dd className="font-mono text-zinc-300">
              {typeof lpBalance.data === "bigint" ? formatUnits(lpBalance.data, 18) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Pool dWETH</dt>
            <dd className="font-mono text-zinc-300">
              {typeof reserve0.data === "bigint" ? formatUnits(reserve0.data, 18) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Pool dUSDC</dt>
            <dd className="font-mono text-zinc-300">
              {typeof reserve1.data === "bigint" ? formatUnits(reserve1.data, 18) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Add liquidity</h3>
        <div className="mt-4 flex flex-col gap-3">
          <input value={amount0} onChange={(event) => setAmount0(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" placeholder="dWETH amount" />
          <input value={amount1} onChange={(event) => setAmount1(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" placeholder="dUSDC amount" />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={!isConnected || !ready || isPending} type="button" onClick={() => void approveBoth()} className="rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-medium disabled:opacity-50">
              Approve
            </button>
            <button disabled={!isConnected || !ready || parsed0 <= 0n || parsed1 <= 0n || isPending} type="button" onClick={() => void addLiquidity()} className="rounded-lg bg-cyan-500/70 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 lg:col-span-2">
        <h3 className="text-sm font-medium text-zinc-100">Remove liquidity</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={removeShares} onChange={(event) => setRemoveShares(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" placeholder="LP shares" />
          <button disabled={!isConnected || !ready || parsedShares <= 0n || isPending} type="button" onClick={() => void removeLiquidity()} className="rounded-lg bg-violet-500/70 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            Remove
          </button>
        </div>
      </div>

      {!ready ? <p className="text-xs text-amber-200/80 lg:col-span-2">Deploy contract addresses are missing.</p> : null}
      {receipt.isLoading ? <p className="text-xs text-zinc-500 lg:col-span-2">Waiting for confirmation...</p> : null}
      {receipt.isSuccess && hash !== undefined ? (
        <a href={explorerTxUrl(hash)} target="_blank" rel="noreferrer" className="text-xs font-medium text-cyan-300/80 hover:text-cyan-200 lg:col-span-2">
          View transaction
        </a>
      ) : null}
      {error ? <p className="text-xs text-rose-300/80 lg:col-span-2">{error.message}</p> : null}
    </div>
  );
}
