"use client";

import { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  demoSwapRouterAbi,
  erc20Abi,
  getDemoDexAddresses,
} from "@dex-terminal/blockchain";

const addresses = getDemoDexAddresses({
  NEXT_PUBLIC_DEMO_WETH_ADDRESS: process.env.NEXT_PUBLIC_DEMO_WETH_ADDRESS,
  NEXT_PUBLIC_DEMO_USDC_ADDRESS: process.env.NEXT_PUBLIC_DEMO_USDC_ADDRESS,
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS,
});

function explorerTxUrl(hash: string) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function SwapBox() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("0.01");
  const [approvedAmount, setApprovedAmount] = useState<bigint>(0n);
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const amountIn = useMemo(() => {
    try {
      return parseUnits(amount || "0", 18);
    } catch {
      return 0n;
    }
  }, [amount]);
  const ready =
    addresses.demoWeth !== undefined &&
    addresses.demoUsdc !== undefined &&
    addresses.demoSwapRouter !== undefined;

  const quote = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "getAmountOut",
    args: addresses.demoWeth !== undefined ? [addresses.demoWeth, amountIn] : undefined,
    query: {
      enabled: ready && amountIn > 0n,
    },
  });
  const amountOut = typeof quote.data === "bigint" ? quote.data : 0n;
  const minAmountOut = (amountOut * 995n) / 1000n;

  async function approve() {
    if (addresses.demoWeth === undefined || addresses.demoSwapRouter === undefined || amountIn <= 0n) {
      return;
    }

    await writeContractAsync({
      abi: erc20Abi,
      address: addresses.demoWeth,
      functionName: "approve",
      args: [addresses.demoSwapRouter, amountIn],
    });
    setApprovedAmount(amountIn);
  }

  async function swap() {
    if (
      address === undefined ||
      addresses.demoWeth === undefined ||
      addresses.demoSwapRouter === undefined ||
      amountIn <= 0n
    ) {
      return;
    }

    await writeContractAsync({
      abi: demoSwapRouterAbi,
      address: addresses.demoSwapRouter,
      functionName: "swapExactTokensForTokens",
      args: [addresses.demoWeth, amountIn, minAmountOut, address],
    });
    setApprovedAmount(0n);
  }

  const canSwap = isConnected && ready && amountIn > 0n && approvedAmount >= amountIn;
  const canApprove = isConnected && ready && amountIn > 0n;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="text-[11px] text-zinc-500">You pay</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full bg-transparent text-2xl font-semibold text-zinc-100 outline-none"
          />
          <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs">dWETH</span>
        </div>
      </div>
      <div className="flex justify-center">
        <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-[10px] text-zinc-500">
          to
        </span>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="text-[11px] text-zinc-500">You receive</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-2xl font-semibold text-zinc-100">
            {amountOut > 0n ? formatUnits(amountOut, 18) : "0"}
          </span>
          <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs">dUSDC</span>
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-500">
        <div className="flex justify-between">
          <span>Router</span>
          <span className="max-w-40 truncate font-mono">{addresses.demoSwapRouter ?? "not deployed"}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Min. received</span>
          <span>{minAmountOut > 0n ? formatUnits(minAmountOut, 18) : "—"}</span>
        </div>
      </div>
      {!ready ? (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/80">
          Deploy contracts and set NEXT_PUBLIC_DEMO_* addresses to enable swaps.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!canApprove || isPending}
          onClick={() => void approve()}
          className="rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={!canSwap || isPending}
          onClick={() => void swap()}
          className="rounded-xl bg-gradient-to-r from-cyan-500/80 to-violet-600/80 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isConnected ? "Swap" : "Connect wallet"}
        </button>
      </div>
      {receipt.isLoading ? <p className="text-xs text-zinc-500">Waiting for confirmation...</p> : null}
      {receipt.isSuccess && hash !== undefined ? (
        <a
          href={explorerTxUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-cyan-300/80 hover:text-cyan-200"
        >
          View transaction
        </a>
      ) : null}
      {error ? <p className="text-xs text-rose-300/80">{error.message}</p> : null}
    </div>
  );
}
