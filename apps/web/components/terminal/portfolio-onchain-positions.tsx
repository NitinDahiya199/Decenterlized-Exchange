"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { demoStakingAbi, demoSwapRouterAbi, getDemoDexAddresses } from "@dex-terminal/blockchain";

const addresses = getDemoDexAddresses({
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS,
  NEXT_PUBLIC_DEMO_STAKING_ADDRESS: process.env.NEXT_PUBLIC_DEMO_STAKING_ADDRESS,
});

function formatAmount(value: unknown) {
  return typeof value === "bigint" ? Number(formatUnits(value, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : "-";
}

function estimateUnderlying({
  shares,
  reserve,
  totalSupply,
}: {
  shares: unknown;
  reserve: unknown;
  totalSupply: unknown;
}) {
  if (typeof shares !== "bigint" || typeof reserve !== "bigint" || typeof totalSupply !== "bigint" || totalSupply === 0n) {
    return "-";
  }

  return formatAmount((shares * reserve) / totalSupply);
}

export function PortfolioOnchainPositions() {
  const { address, isConnected } = useAccount();
  const enabled = isConnected && address !== undefined;
  const lpBalance = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "balanceOf",
    args: address !== undefined ? [address] : undefined,
    query: { enabled: enabled && addresses.demoSwapRouter !== undefined },
  });
  const totalSupply = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "totalSupply",
    query: { enabled: addresses.demoSwapRouter !== undefined },
  });
  const reserve0 = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "reserve0",
    query: { enabled: addresses.demoSwapRouter !== undefined },
  });
  const reserve1 = useReadContract({
    abi: demoSwapRouterAbi,
    address: addresses.demoSwapRouter,
    functionName: "reserve1",
    query: { enabled: addresses.demoSwapRouter !== undefined },
  });
  const staked = useReadContract({
    abi: demoStakingAbi,
    address: addresses.demoStaking,
    functionName: "balanceOf",
    args: address !== undefined ? [address] : undefined,
    query: { enabled: enabled && addresses.demoStaking !== undefined },
  });
  const earned = useReadContract({
    abi: demoStakingAbi,
    address: addresses.demoStaking,
    functionName: "earned",
    args: address !== undefined ? [address] : undefined,
    query: { enabled: enabled && addresses.demoStaking !== undefined },
  });

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Devnet LP position</h3>
        <p className="mt-1 text-[11px] text-zinc-500">Router LP shares and estimated underlying assets.</p>
        <dl className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">LP shares</dt>
            <dd className="font-mono text-zinc-300">{formatAmount(lpBalance.data)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Underlying dWETH</dt>
            <dd className="font-mono text-zinc-300">
              {estimateUnderlying({ shares: lpBalance.data, reserve: reserve0.data, totalSupply: totalSupply.data })}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Underlying dUSDC</dt>
            <dd className="font-mono text-zinc-300">
              {estimateUnderlying({ shares: lpBalance.data, reserve: reserve1.data, totalSupply: totalSupply.data })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Devnet staking</h3>
        <p className="mt-1 text-[11px] text-zinc-500">Staked demo token balance and claimable rewards.</p>
        <dl className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Staked dWETH</dt>
            <dd className="font-mono text-zinc-300">{formatAmount(staked.data)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Earned dUSDC</dt>
            <dd className="font-mono text-zinc-300">{formatAmount(earned.data)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
