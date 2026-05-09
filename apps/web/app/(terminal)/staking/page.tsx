import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";

export const metadata: Metadata = {
  title: "Staking · DEX Terminal",
  description: "Stake demo tokens on devnet staking contract.",
};

export default function StakingPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassPanel title="Active stakes" subtitle="APR · rewards accrued">
        <p className="py-6 text-center text-sm text-zinc-600">No stakes · read from contract/DB</p>
      </GlassPanel>
      <GlassPanel title="Stake" subtitle="Amount · lock (optional)">
        <div className="flex flex-col gap-3">
          <input
            readOnly
            placeholder="Amount"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            className="rounded-lg bg-gradient-to-r from-amber-500/70 to-orange-600/70 py-2.5 text-sm font-semibold text-white"
          >
            Stake (stub)
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
