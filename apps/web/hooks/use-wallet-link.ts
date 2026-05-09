"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { linkedWalletResponseSchema, walletNonceResponseSchema } from "@dex-terminal/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type WalletLinkState = {
  linked: boolean;
  error: string | null;
};

export function useWalletLink(): WalletLinkState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
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
    const walletAddress = address;

    async function linkWallet() {
      try {
        const nonceUrl = new URL("/wallets/nonce", apiUrl);
        nonceUrl.searchParams.set("address", walletAddress);
        nonceUrl.searchParams.set("chainId", String(chainId));
        const nonceResponse = await fetch(nonceUrl, {
          credentials: "include",
          signal: abortController.signal,
        });
        const noncePayload = await nonceResponse.json();

        if (!nonceResponse.ok) {
          const message = typeof noncePayload?.message === "string" ? noncePayload.message : "Wallet nonce failed";
          throw new Error(message);
        }

        const challenge = walletNonceResponseSchema.parse(noncePayload);
        const signature = await signMessageAsync({ message: challenge.message });
        const response = await fetch(new URL("/wallets/verify", apiUrl), {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            address: walletAddress,
            chainId,
            nonce: challenge.nonce,
            message: challenge.message,
            signature,
          }),
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
  }, [address, chainId, isConnected, signMessageAsync]);

  return state;
}
