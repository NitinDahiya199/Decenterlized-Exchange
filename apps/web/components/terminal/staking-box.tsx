"use client";

import { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { demoStakingAbi, erc20Abi, getDemoDexAddresses } from "@dex-terminal/blockchain";

const addresses = getDemoDexAddresses({
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_DEMO_WETH_ADDRESS: process.env.NEXT_PUBLIC_DEMO_WETH_ADDRESS,
  NEXT_PUBLIC_DEMO_STAKING_ADDRESS: process.env.NEXT_PUBLIC_DEMO_STAKING_ADDRESS,
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

export function StakingBox() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("0.01");
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const parsedAmount = useMemo(() => parseAmount(amount), [amount]);
  const ready = addresses.demoWeth !== undefined && addresses.demoStaking !== undefined;

  const staked = useReadContract({
    abi: demoStakingAbi,
    address: addresses.demoStaking,
    functionName: "balanceOf",
    args: address !== undefined ? [address] : undefined,
    query: { enabled: ready && address !== undefined },
  });
  const earned = useReadContract({
    abi: demoStakingAbi,
    address: addresses.demoStaking,
    functionName: "earned",
    args: address !== undefined ? [address] : undefined,
    query: { enabled: ready && address !== undefined },
  });

  async function approve() {
    if (addresses.demoWeth === undefined || addresses.demoStaking === undefined || parsedAmount <= 0n) {
      return;
    }

    await writeContractAsync({
      abi: erc20Abi,
      address: addresses.demoWeth,
      functionName: "approve",
      args: [addresses.demoStaking, parsedAmount],
    });
  }

  async function stake() {
    if (addresses.demoStaking === undefined || parsedAmount <= 0n) {
      return;
    }

    await writeContractAsync({
      abi: demoStakingAbi,
      address: addresses.demoStaking,
      functionName: "stake",
      args: [parsedAmount],
    });
  }

  async function withdraw() {
    if (addresses.demoStaking === undefined || parsedAmount <= 0n) {
      return;
    }

    await writeContractAsync({
      abi: demoStakingAbi,
      address: addresses.demoStaking,
      functionName: "withdraw",
      args: [parsedAmount],
    });
  }

  async function claim() {
    if (addresses.demoStaking === undefined) {
      return;
    }

    await writeContractAsync({
      abi: demoStakingAbi,
      address: addresses.demoStaking,
      functionName: "claim",
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Active stake</h3>
        <dl className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Staked dWETH</dt>
            <dd className="font-mono text-zinc-300">{typeof staked.data === "bigint" ? formatUnits(staked.data, 18) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Earned dUSDC</dt>
            <dd className="font-mono text-zinc-300">{typeof earned.data === "bigint" ? formatUnits(earned.data, 18) : "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Stake controls</h3>
        <div className="mt-4 flex flex-col gap-3">
          <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="dWETH amount" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={!isConnected || !ready || parsedAmount <= 0n || isPending} type="button" onClick={() => void approve()} className="rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-medium disabled:opacity-50">
              Approve
            </button>
            <button disabled={!isConnected || !ready || parsedAmount <= 0n || isPending} type="button" onClick={() => void stake()} className="rounded-lg bg-amber-500/70 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Stake
            </button>
            <button disabled={!isConnected || !ready || parsedAmount <= 0n || isPending} type="button" onClick={() => void withdraw()} className="rounded-lg bg-white/10 py-2.5 text-sm font-medium disabled:opacity-50">
              Withdraw
            </button>
            <button disabled={!isConnected || !ready || isPending} type="button" onClick={() => void claim()} className="rounded-lg bg-emerald-500/70 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Claim
            </button>
          </div>
        </div>
      </div>

      {!ready ? <p className="text-xs text-amber-200/80 md:col-span-2">Staking contract address is missing.</p> : null}
      {receipt.isLoading ? <p className="text-xs text-zinc-500 md:col-span-2">Waiting for confirmation...</p> : null}
      {receipt.isSuccess && hash !== undefined ? (
        <a href={explorerTxUrl(hash)} target="_blank" rel="noreferrer" className="text-xs font-medium text-cyan-300/80 hover:text-cyan-200 md:col-span-2">
          View transaction
        </a>
      ) : null}
      {error ? <p className="text-xs text-rose-300/80 md:col-span-2">{error.message}</p> : null}
    </div>
  );
}
