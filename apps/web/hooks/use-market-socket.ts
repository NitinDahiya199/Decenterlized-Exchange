"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { marketTickerEventName, type MarketTicker } from "@dex-terminal/types";

type MarketSocketState = {
  connected: boolean;
  ticker: MarketTicker | null;
};

const wsUrl =
  process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useMarketSocket(slug = "ETH-USDC"): MarketSocketState {
  const [state, setState] = useState<MarketSocketState>({
    connected: false,
    ticker: null,
  });

  useEffect(() => {
    const socket = io(wsUrl, {
      transports: ["websocket"],
    });
    const tickerEventName = marketTickerEventName(slug);

    socket.on("connect", () => {
      setState((current) => ({ ...current, connected: true }));
    });

    socket.on("disconnect", () => {
      setState((current) => ({ ...current, connected: false }));
    });

    socket.on(tickerEventName, (ticker: MarketTicker) => {
      setState((current) => ({ ...current, ticker }));
    });

    return () => {
      socket.disconnect();
    };
  }, [slug]);

  return state;
}
