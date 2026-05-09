import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";
import { SwapBox } from "@/components/terminal/swap-box";

export const metadata: Metadata = {
  title: "Swap · DEX Terminal",
  description: "AMM-style swap via devnet contracts (Wagmi next).",
};

export default function SwapPage() {
  return (
    <div className="mx-auto max-w-lg">
      <GlassPanel title="Swap" subtitle="Router call from wallet · slippage & impact">
        <SwapBox />
      </GlassPanel>
    </div>
  );
}
