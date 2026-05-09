import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";
import { LiquidityBox } from "@/components/terminal/liquidity-box";

export const metadata: Metadata = {
  title: "Liquidity · DEX Terminal",
  description: "Add / remove liquidity on devnet pools.",
};

export default function LiquidityPage() {
  return (
    <div className="grid gap-4">
      <GlassPanel title="Liquidity" subtitle="dWETH / dUSDC · add and remove LP shares">
        <LiquidityBox />
      </GlassPanel>
    </div>
  );
}
