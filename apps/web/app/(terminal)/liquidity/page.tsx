import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";

export const metadata: Metadata = {
  title: "Liquidity · DEX Terminal",
  description: "Add / remove liquidity on devnet pools.",
};

export default function LiquidityPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassPanel title="Your positions" subtitle="LP tokens & share of pool">
        <p className="py-6 text-center text-sm text-zinc-600">No positions · index from chain/DB</p>
      </GlassPanel>
      <GlassPanel title="Add liquidity" subtitle="Pair · amounts · min LP">
        <div className="flex flex-col gap-3">
          <input
            readOnly
            placeholder="Token A amount"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          />
          <input
            readOnly
            placeholder="Token B amount"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            className="rounded-lg bg-white/10 py-2.5 text-sm font-medium text-zinc-100"
          >
            Preview & add (stub)
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
