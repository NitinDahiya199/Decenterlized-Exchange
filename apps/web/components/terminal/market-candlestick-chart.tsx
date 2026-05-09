"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import { candlesResponseSchema, type CandleInterval, type CandlesResponse } from "@dex-terminal/types";

type LoadState = "loading" | "ready" | "empty" | "error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function toChartData(response: CandlesResponse): CandlestickData<UTCTimestamp>[] {
  return response.candles.map((candle) => ({
    time: Math.floor(new Date(candle.bucket).getTime() / 1000) as UTCTimestamp,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
  }));
}

export function MarketCandlestickChart({
  slug = "ETH-USDC",
  interval = "H1",
}: {
  slug?: string;
  interval?: CandleInterval;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCandles() {
      setLoadState("loading");
      setErrorMessage(null);

      try {
        const url = new URL(`/pairs/${slug}/candles`, apiUrl);
        url.searchParams.set("interval", interval);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Candles request failed with ${response.status}`);
        }

        const body = candlesResponseSchema.parse(await response.json());
        if (cancelled) {
          return;
        }

        const chartData = toChartData(body);
        setLoadState(chartData.length > 0 ? "ready" : "empty");

        const container = containerRef.current;
        if (container === null || chartData.length === 0) {
          return;
        }

        const chart = createChart(container, {
          autoSize: true,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "rgba(212, 212, 216, 0.72)",
          },
          grid: {
            vertLines: { color: "rgba(255, 255, 255, 0.04)" },
            horzLines: { color: "rgba(255, 255, 255, 0.04)" },
          },
          rightPriceScale: {
            borderColor: "rgba(255, 255, 255, 0.08)",
          },
          timeScale: {
            borderColor: "rgba(255, 255, 255, 0.08)",
            timeVisible: true,
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
        });

        const series = chart.addSeries(CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#f43f5e",
          borderUpColor: "#22c55e",
          borderDownColor: "#f43f5e",
          wickUpColor: "#22c55e",
          wickDownColor: "#f43f5e",
        });

        series.setData(chartData);
        chart.timeScale().fitContent();

        return () => {
          chart.remove();
        };
      } catch (error) {
        if (!cancelled) {
          setLoadState("error");
          setErrorMessage(error instanceof Error ? error.message : "Unable to load candles");
        }
      }
    }

    let cleanup: (() => void) | undefined;
    void loadCandles().then((chartCleanup) => {
      cleanup = chartCleanup;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [interval, slug]);

  return (
    <div className="relative h-[300px] min-h-[300px] overflow-hidden rounded-lg border border-white/10 bg-black/20 lg:h-[430px]">
      <div ref={containerRef} className="h-full w-full" />

      {loadState !== "ready" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-center text-sm text-zinc-500">
          {loadState === "loading" ? "Loading candles..." : null}
          {loadState === "empty" ? "No candles available yet" : null}
          {loadState === "error" ? errorMessage : null}
        </div>
      ) : null}
    </div>
  );
}
