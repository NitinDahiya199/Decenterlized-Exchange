"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { balancesResponseSchema, type BalanceRow } from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type LoadState = "idle" | "loading" | "ready" | "unauthorized" | "error";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function PortfolioBalances() {
  const { isConnected } = useAccount();
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    async function loadBalances(attempt = 0) {
      if (!isConnected) {
        setBalances([]);
        setLoadState("idle");
        return;
      }

      setLoadState("loading");
      setErrorMessage(null);

      try {
        const response = await fetch(new URL("/user/balances", apiUrl), {
          credentials: "include",
        });

        if (response.status === 401 && attempt < 2) {
          retry = setTimeout(() => {
            void loadBalances(attempt + 1);
          }, 800);
          return;
        }

        if (response.status === 401) {
          setLoadState("unauthorized");
          return;
        }

        if (!response.ok) {
          throw new Error(`Balances request failed with ${response.status}`);
        }

        const body = balancesResponseSchema.parse(await response.json());
        if (!cancelled) {
          setBalances(body.balances);
          setLoadState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState("error");
          setErrorMessage(error instanceof Error ? error.message : "Unable to load balances");
        }
      }
    }

    void loadBalances();

    return () => {
      cancelled = true;
      if (retry !== undefined) {
        clearTimeout(retry);
      }
    };
  }, [isConnected]);

  const simulatedRows = useMemo(() => balances.filter((balance) => balance.simulated), [balances]);

  return (
    <>
      <p className="text-3xl font-semibold tracking-tight text-zinc-100">{balances.length}</p>
      <p className="mt-2 text-xs text-zinc-500">
        {isConnected ? `${simulatedRows.length} simulated assets linked to this session.` : "Connect wallet to aggregate balances."}
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2 font-medium">Asset</th>
              <th className="pb-2 text-right font-medium">Available</th>
              <th className="pb-2 text-right font-medium">Locked</th>
              <th className="pb-2 text-right font-medium">Total</th>
              <th className="pb-2 text-right font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {loadState === "loading" ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-600">
                  Loading balances...
                </td>
              </tr>
            ) : null}
            {loadState === "idle" ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-600">
                  Connect wallet to load portfolio balances.
                </td>
              </tr>
            ) : null}
            {loadState === "unauthorized" ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-600">
                  Wallet connected, waiting for server session.
                </td>
              </tr>
            ) : null}
            {loadState === "error" ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-rose-300/80">
                  {errorMessage}
                </td>
              </tr>
            ) : null}
            {loadState === "ready" && balances.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-600">
                  No balances found for this linked wallet yet.
                </td>
              </tr>
            ) : null}
            {loadState === "ready"
              ? balances.map((balance) => (
                  <tr key={balance.id} className="border-t border-white/5">
                    <td className="py-2">
                      <div className="font-medium text-zinc-100">{balance.token.symbol}</div>
                      <div className="font-mono text-[10px] text-zinc-600">
                        {shortAddress(balance.wallet.address)} · {balance.wallet.chainId}
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono">{balance.available}</td>
                    <td className="py-2 text-right font-mono">{balance.locked}</td>
                    <td className="py-2 text-right font-mono">{balance.total}</td>
                    <td className="py-2 text-right text-zinc-500">
                      {balance.simulated ? "Simulated" : "Indexed"}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
