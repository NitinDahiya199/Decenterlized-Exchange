"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  marketOrderbookEventName,
  orderbookResponseSchema,
  type OrderbookLevel,
  type OrderbookResponse,
} from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const wsUrl =
  process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const refreshEventName = "market:refresh";

function formatLevel(level: OrderbookLevel | undefined) {
  return {
    price: level?.price ?? "—",
    quantity: level?.quantity ?? "—",
  };
}

export function MarketOrderbook({ slug = "ETH-USDC" }: { slug?: string }) {
  const [orderbook, setOrderbook] = useState<OrderbookResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrderbook() {
      const response = await fetch(new URL(`/pairs/${slug}/orderbook`, apiUrl));
      if (!response.ok) {
        return;
      }

      const body = orderbookResponseSchema.parse(await response.json());
      if (!cancelled) {
        setOrderbook(body);
      }
    }

    const socket = io(wsUrl, {
      transports: ["websocket"],
    });
    const eventName = marketOrderbookEventName(slug);
    const handleRefresh = () => {
      void loadOrderbook();
    };

    socket.on(eventName, (nextOrderbook: OrderbookResponse) => {
      setOrderbook(nextOrderbook);
    });
    window.addEventListener(refreshEventName, handleRefresh);
    void loadOrderbook();

    return () => {
      cancelled = true;
      socket.disconnect();
      window.removeEventListener(refreshEventName, handleRefresh);
    };
  }, [slug]);

  const bids = Array.from({ length: 6 }, (_, index) => formatLevel(orderbook?.bids[index]));
  const asks = Array.from({ length: 6 }, (_, index) => formatLevel(orderbook?.asks[index]));

  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
      <div className="text-zinc-500">Bid</div>
      <div className="text-right text-zinc-500">Size</div>
      {bids.map((level, index) => (
        <div key={`b-${index}`} className="contents text-emerald-400/80">
          <div>{level.price}</div>
          <div className="text-right text-zinc-500">{level.quantity}</div>
        </div>
      ))}
      <div className="col-span-2 my-2 border-t border-white/10" />
      {asks.map((level, index) => (
        <div key={`a-${index}`} className="contents text-rose-400/80">
          <div>{level.price}</div>
          <div className="text-right text-zinc-500">{level.quantity}</div>
        </div>
      ))}
    </div>
  );
}
