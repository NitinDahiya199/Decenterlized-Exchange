"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { linkedWalletResponseSchema } from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type WalletLinkState = {
  linked: boolean;
  error: string | null;
};

export function useWalletLink(): WalletLinkState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [state, setState] = useState<WalletLinkState>({
    linked: false,
    error: null,
  });

  useEffect(() => {
    if (!isConnected || address === undefined) {
      setState({ linked: false, error: null });
      return;
    }

    const abortController = new AbortController();

    async function linkWallet() {
      try {
        const response = await fetch(new URL("/wallets/link", apiUrl), {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ address, chainId }),
          signal: abortController.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          const message = typeof payload?.message === "string" ? payload.message : "Wallet link failed";
          throw new Error(message);
        }

        linkedWalletResponseSchema.parse(payload);
        setState({ linked: true, error: null });
      } catch (error) {
        if (!abortController.signal.aborted) {
          setState({
            linked: false,
            error: error instanceof Error ? error.message : "Wallet link failed",
          });
        }
      }
    }

    void linkWallet();

    return () => {
      abortController.abort();
    };
  }, [address, chainId, isConnected]);

  return state;
}
