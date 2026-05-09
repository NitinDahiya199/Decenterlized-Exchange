"use client";

import { useEffect, useState } from "react";
import { tradesResponseSchema, type Trade } from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const refreshEventName = "market:refresh";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function RecentTrades({ slug = "ETH-USDC" }: { slug?: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTrades() {
      const url = new URL(`/pairs/${slug}/trades`, apiUrl);
      url.searchParams.set("limit", "8");

      const response = await fetch(url);
      if (!response.ok) {
        return;
      }

      const body = tradesResponseSchema.parse(await response.json());
      if (!cancelled) {
        setTrades(body.trades);
      }
    }

    const interval = setInterval(() => {
      void loadTrades();
    }, 5_000);
    const handleRefresh = () => {
      void loadTrades();
    };

    window.addEventListener(refreshEventName, handleRefresh);
    void loadTrades();

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(refreshEventName, handleRefresh);
    };
  }, [slug]);

  return (
    <ul className="space-y-1 font-mono text-[11px] text-zinc-500">
      <li className="grid grid-cols-3 border-b border-white/5 pb-1 text-zinc-400">
        <span>Time</span>
        <span className="text-right">Price</span>
        <span className="text-right">Qty</span>
      </li>
      {trades.length === 0 ? (
        <li className="py-6 text-center text-zinc-600">No trades yet</li>
      ) : (
        trades.map((trade) => (
          <li key={trade.id} className="grid grid-cols-3">
            <span>{formatTime(trade.executedAt)}</span>
            <span className={trade.side === "BUY" ? "text-right text-emerald-400" : "text-right text-rose-400"}>
              {trade.price}
            </span>
            <span className="text-right text-zinc-400">{trade.quantity}</span>
          </li>
        ))
      )}
    </ul>
  );
}
