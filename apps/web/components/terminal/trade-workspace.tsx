"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { GlassPanel } from "@/components/terminal/glass-panel";
import { MarketCandlestickChart } from "@/components/terminal/market-candlestick-chart";
import { MarketOrderbook } from "@/components/terminal/market-orderbook";
import { OrderEntry } from "@/components/terminal/order-entry";
import { RecentTrades } from "@/components/terminal/recent-trades";

function ResizeHandle() {
  return <Separator className="hidden w-2 rounded-full bg-white/5 transition hover:bg-cyan-400/30 lg:block" />;
}

export function TradeWorkspace() {
  return (
    <Group orientation="horizontal" className="min-h-[780px] gap-2">
      <Panel defaultSize={65} minSize={45}>
        <Group orientation="vertical" className="gap-2">
          <Panel defaultSize={70} minSize={45}>
            <GlassPanel title="Chart" subtitle="ETH-USDC · H1 candles" className="h-full">
              <MarketCandlestickChart slug="ETH-USDC" interval="H1" />
            </GlassPanel>
          </Panel>
          <Separator className="h-2 rounded-full bg-white/5 transition hover:bg-cyan-400/30" />
          <Panel defaultSize={30} minSize={18}>
            <GlassPanel title="Recent trades" subtitle="Public tape · REST + WS" className="h-full">
              <RecentTrades slug="ETH-USDC" />
            </GlassPanel>
          </Panel>
        </Group>
      </Panel>

      <ResizeHandle />

      <Panel defaultSize={35} minSize={25}>
        <Group orientation="vertical" className="gap-2">
          <Panel defaultSize={55} minSize={35}>
            <GlassPanel title="Order book" subtitle="Bids / asks · virtualized" className="h-full">
              <MarketOrderbook slug="ETH-USDC" />
            </GlassPanel>
          </Panel>
          <Separator className="h-2 rounded-full bg-white/5 transition hover:bg-cyan-400/30" />
          <Panel defaultSize={45} minSize={30}>
            <GlassPanel title="Order entry" subtitle="Limit / market · keyboard enabled" className="h-full">
              <OrderEntry slug="ETH-USDC" />
            </GlassPanel>
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}
