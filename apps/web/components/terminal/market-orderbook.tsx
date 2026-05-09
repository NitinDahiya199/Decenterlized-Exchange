"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  const parentRef = useRef<HTMLDivElement>(null);

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

  const rows = useMemo(() => {
    const asks = Array.from({ length: 24 }, (_, index) => ({
      id: `a-${index}`,
      side: "ask" as const,
      ...formatLevel(orderbook?.asks[index]),
    })).reverse();
    const bids = Array.from({ length: 24 }, (_, index) => ({
      id: `b-${index}`,
      side: "bid" as const,
      ...formatLevel(orderbook?.bids[index]),
    }));

    return [...asks, { id: "mid", side: "mid" as const, price: "Spread", quantity: "—" }, ...bids];
  }, [orderbook]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 8,
  });

  return (
    <div className="font-mono text-[11px]">
      <div className="grid grid-cols-2 gap-2 pb-2 text-zinc-500">
        <div>Price</div>
        <div className="text-right">Size</div>
      </div>
      <div ref={parentRef} className="h-[360px] overflow-auto rounded-lg border border-white/5 bg-black/10">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (row === undefined) {
              return null;
            }
            const rowClass =
              row.side === "bid"
                ? "text-emerald-400/80"
                : row.side === "ask"
                  ? "text-rose-400/80"
                  : "text-cyan-300/80";

            return (
              <div
                key={row.id}
                className={`absolute left-0 grid w-full grid-cols-2 gap-2 px-2 ${rowClass}`}
                style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}
              >
                <div>{row.price}</div>
                <div className="text-right text-zinc-500">{row.quantity}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
