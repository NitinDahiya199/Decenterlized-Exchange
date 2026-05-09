import type { Metadata } from "next";
import { TradeWorkspace } from "@/components/terminal/trade-workspace";

export const metadata: Metadata = {
  title: "Trade · DEX Terminal",
  description: "Desktop trading terminal — chart, order book, and order entry.",
};

export default function TradePage() {
  return <TradeWorkspace />;
}
