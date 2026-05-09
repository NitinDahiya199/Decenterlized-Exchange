import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";

export const metadata: Metadata = {
  title: "Swap · DEX Terminal",
  description: "AMM-style swap via devnet contracts (Wagmi next).",
};

export default function SwapPage() {
  return (
    <div className="mx-auto max-w-lg">
      <GlassPanel title="Swap" subtitle="Router call from wallet · slippage & impact">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] text-zinc-500">You pay</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold text-zinc-100">0</span>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs"
              >
                Select token
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-[10px] text-zinc-500">
              ↕
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] text-zinc-500">You receive</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold text-zinc-100">0</span>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs"
              >
                Select token
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-500">
            <div className="flex justify-between">
              <span>Price impact</span>
              <span>—</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Min. received</span>
              <span>—</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500/80 to-violet-600/80 py-3 text-sm font-semibold text-white"
          >
            Connect wallet to swap
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
