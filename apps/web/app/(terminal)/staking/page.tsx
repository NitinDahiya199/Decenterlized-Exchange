import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";
import { StakingBox } from "@/components/terminal/staking-box";

export const metadata: Metadata = {
  title: "Staking · DEX Terminal",
  description: "Stake demo tokens on devnet staking contract.",
};

export default function StakingPage() {
  return (
    <div className="grid gap-4">
      <GlassPanel title="Staking" subtitle="Stake dWETH · earn dUSDC rewards">
        <StakingBox />
      </GlassPanel>
    </div>
  );
}
