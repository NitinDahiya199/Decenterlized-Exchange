"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { orderMutationResponseSchema, ordersResponseSchema, type Order } from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const refreshEventName = "market:refresh";

type OrdersTab = "open" | "history";

function formatOrderStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export function UserOrders() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<OrdersTab>("open");
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function loadOrders(nextTab = tab) {
    if (!isConnected) {
      setOrders([]);
      setStatus("Connect wallet to load orders.");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const url = new URL("/orders", apiUrl);
      url.searchParams.set("status", nextTab);
      const response = await fetch(url, { credentials: "include" });
      const payload = await response.json();

      if (!response.ok) {
        const message = typeof payload?.message === "string" ? payload.message : "Unable to load orders";
        throw new Error(message);
      }

      setOrders(ordersResponseSchema.parse(payload).orders);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    setCancellingId(orderId);
    setStatus(null);
    try {
      const response = await fetch(new URL(`/orders/${orderId}`, apiUrl), {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        const message = typeof payload?.message === "string" ? payload.message : "Unable to cancel order";
        throw new Error(message);
      }

      orderMutationResponseSchema.parse(payload);
      window.dispatchEvent(new Event(refreshEventName));
      await loadOrders(tab);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to cancel order");
    } finally {
      setCancellingId(null);
    }
  }

  useEffect(() => {
    void loadOrders(tab);
    const refresh = () => void loadOrders(tab);
    window.addEventListener(refreshEventName, refresh);
    return () => window.removeEventListener(refreshEventName, refresh);
  }, [isConnected, tab]);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["open", "history"] as const).map((nextTab) => (
          <button
            key={nextTab}
            type="button"
            onClick={() => setTab(nextTab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === nextTab ? "bg-cyan-500/15 text-cyan-300" : "bg-white/5 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {nextTab === "open" ? "Open" : "History"}
          </button>
        ))}
      </div>

      <div className="max-h-56 overflow-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2 font-medium">Pair</th>
              <th className="pb-2 font-medium">Side</th>
              <th className="pb-2 text-right font-medium">Price</th>
              <th className="pb-2 text-right font-medium">Filled</th>
              <th className="pb-2 text-right font-medium">Status</th>
              <th className="pb-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-600">
                  Loading orders...
                </td>
              </tr>
            ) : null}
            {!loading && orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-600">
                  {status ?? "No orders found."}
                </td>
              </tr>
            ) : null}
            {!loading
              ? orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/5">
                    <td className="py-2 font-medium">{order.slug}</td>
                    <td className={order.side === "BUY" ? "text-emerald-300/80" : "text-rose-300/80"}>{order.side}</td>
                    <td className="py-2 text-right font-mono">{order.price ?? "Market"}</td>
                    <td className="py-2 text-right font-mono">
                      {order.filledQuantity}/{order.quantity}
                    </td>
                    <td className="py-2 text-right text-zinc-500">{formatOrderStatus(order.status)}</td>
                    <td className="py-2 text-right">
                      {order.status === "OPEN" || order.status === "PARTIALLY_FILLED" ? (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => void cancelOrder(order.id)}
                          className="rounded-md border border-rose-400/20 px-2 py-1 text-rose-300/80 disabled:opacity-50"
                        >
                          {cancellingId === order.id ? "..." : "Cancel"}
                        </button>
                      ) : (
                        <span className="text-zinc-700">-</span>
                      )}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
      {status && orders.length > 0 ? <p className="mt-2 text-[11px] text-rose-300/80">{status}</p> : null}
    </div>
  );
}
