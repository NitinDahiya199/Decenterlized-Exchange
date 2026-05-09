import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";
import { PortfolioBalances } from "@/components/terminal/portfolio-balances";

export const metadata: Metadata = {
  title: "Portfolio · DEX Terminal",
  description: "Holdings, simulated balances, and activity.",
};

export default function PortfolioPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassPanel title="Net worth" subtitle="Simulated + devnet (later)">
        <p className="text-3xl font-semibold tracking-tight text-zinc-100">Devnet</p>
        <p className="mt-2 text-xs text-zinc-500">Balances are read from the linked wallet session.</p>
      </GlassPanel>
      <GlassPanel title="Allocation" subtitle="By asset">
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 text-xs text-zinc-600">
          Allocation chart later
        </div>
      </GlassPanel>
      <GlassPanel title="Positions" subtitle="Spot · perps (future)" className="md:col-span-2">
        <PortfolioBalances />
      </GlassPanel>
    </div>
  );
}
