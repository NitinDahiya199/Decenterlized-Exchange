"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { createDexChainFromEnv } from "@dex-terminal/blockchain";

const dexChain = createDexChainFromEnv({
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
});

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const sharedConfig = {
  chains: [dexChain],
  ssr: true,
  transports: {
    [dexChain.id]: http(dexChain.rpcUrls.default.http[0]),
  },
} as const;

const wagmiConfig =
  walletConnectProjectId !== undefined && walletConnectProjectId.length > 0
    ? getDefaultConfig({
        appName: "DEX Terminal",
        projectId: walletConnectProjectId,
        ...sharedConfig,
      })
    : createConfig({
        ...sharedConfig,
        connectors: [
          injected({
            target: "metaMask",
          }),
        ],
      });

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
