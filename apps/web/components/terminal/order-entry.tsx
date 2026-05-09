"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAccount } from "wagmi";
import {
  orderMutationResponseSchema,
  type CreateOrderBody,
  type OrderSide,
  type OrderType,
} from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const refreshEventName = "market:refresh";

function sideButtonClass(active: boolean, side: OrderSide) {
  const activeClass =
    side === "BUY"
      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
      : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25";

  return `flex-1 rounded-lg py-2 text-xs font-semibold transition ${
    active ? activeClass : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
  }`;
}

export function OrderEntry({ slug = "ETH-USDC" }: { slug?: string }) {
  const { address } = useAccount();
  const formRef = useRef<HTMLFormElement>(null);
  const [side, setSide] = useState<OrderSide>("BUY");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState("3025");
  const [quantity, setQuantity] = useState("0.1");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function targetIsEditable(target: EventTarget | null) {
      return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (targetIsEditable(event.target)) {
        return;
      }

      if (event.altKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSide("BUY");
      }
      if (event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setSide("SELL");
      }
      if (event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setType("MARKET");
      }
      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setType("LIMIT");
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }

    function handleSetSide(event: Event) {
      const detail = (event as CustomEvent<OrderSide>).detail;
      if (detail === "BUY" || detail === "SELL") {
        setSide(detail);
      }
    }

    function handleSetType(event: Event) {
      const detail = (event as CustomEvent<OrderType>).detail;
      if (detail === "LIMIT" || detail === "MARKET") {
        setType(detail);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("trade:set-side", handleSetSide);
    window.addEventListener("trade:set-type", handleSetType);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("trade:set-side", handleSetSide);
      window.removeEventListener("trade:set-type", handleSetType);
    };
  }, []);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const body: CreateOrderBody = {
      slug,
      side,
      type,
      quantity,
      ...(type === "LIMIT" ? { price } : {}),
      ...(address !== undefined ? { walletAddress: address } : {}),
    };

    try {
      const response = await fetch(new URL("/orders", apiUrl), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        const message = typeof payload?.message === "string" ? payload.message : "Order failed";
        throw new Error(message);
      }

      const result = orderMutationResponseSchema.parse(payload);
      setStatus(
        `${result.order.status.toLowerCase().replaceAll("_", " ")} · filled ${result.order.filledQuantity}/${result.order.quantity}`,
      );
      window.dispatchEvent(new Event(refreshEventName));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} className="flex flex-col gap-3" onSubmit={submitOrder}>
      <div className="flex gap-2">
        {(["BUY", "SELL"] as const).map((nextSide) => (
          <button
            key={nextSide}
            type="button"
            className={sideButtonClass(side === nextSide, nextSide)}
            onClick={() => setSide(nextSide)}
          >
            {nextSide === "BUY" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["LIMIT", "MARKET"] as const).map((nextType) => (
          <button
            key={nextType}
            type="button"
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              type === nextType
                ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/25"
                : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
            }`}
            onClick={() => setType(nextType)}
          >
            {nextType}
          </button>
        ))}
      </div>
      <label className="text-[11px] text-zinc-500">
        Price
        <input
          disabled={type === "MARKET"}
          value={type === "MARKET" ? "" : price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder={type === "MARKET" ? "Market" : "0.00"}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-cyan-500/40 disabled:cursor-not-allowed disabled:text-zinc-600"
        />
      </label>
      <label className="text-[11px] text-zinc-500">
        Size
        <input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="0.00"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-cyan-500/40"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-gradient-to-r from-cyan-500/80 to-violet-600/80 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Placing..." : "Place order"}
      </button>
      {status ? <p className="text-[11px] text-zinc-500">{status}</p> : null}
      <p className="text-[10px] text-zinc-600">Shortcuts: Alt+B/S side · Alt+L/M type · Ctrl+Enter submit</p>
    </form>
  );
}
