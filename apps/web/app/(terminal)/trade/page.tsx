import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";
import { MarketCandlestickChart } from "@/components/terminal/market-candlestick-chart";
import { MarketOrderbook } from "@/components/terminal/market-orderbook";
import { OrderEntry } from "@/components/terminal/order-entry";
import { RecentTrades } from "@/components/terminal/recent-trades";

export const metadata: Metadata = {
  title: "Trade · DEX Terminal",
  description: "Desktop trading terminal — chart, order book, and order entry.",
};

export default function TradePage() {
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-5">
      <GlassPanel
        title="Chart"
        subtitle="ETH-USDC · H1 candles"
        className="lg:col-span-8 lg:row-span-2 min-h-[320px] lg:min-h-[480px]"
      >
        <MarketCandlestickChart slug="ETH-USDC" interval="H1" />
      </GlassPanel>

      <GlassPanel
        title="Order book"
        subtitle="Bids / asks · WebSocket + REST"
        className="lg:col-span-4 min-h-[200px]"
      >
        <MarketOrderbook slug="ETH-USDC" />
      </GlassPanel>

      <GlassPanel
        title="Order entry"
        subtitle="Limit / market · signed later (EIP-712)"
        className="lg:col-span-4"
      >
        <OrderEntry slug="ETH-USDC" />
      </GlassPanel>

      <GlassPanel
        title="Recent trades"
        subtitle="Public tape · REST + WS"
        className="lg:col-span-6"
      >
        <RecentTrades slug="ETH-USDC" />
      </GlassPanel>

      <GlassPanel title="Watchlist" subtitle="Pairs & alerts" className="lg:col-span-6">
        <div className="flex flex-wrap gap-2">
          {["ETH/USDC", "BTC/USDC", "SOL/USDC"].map((p) => (
            <span
              key={p}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
            >
              {p}
            </span>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
