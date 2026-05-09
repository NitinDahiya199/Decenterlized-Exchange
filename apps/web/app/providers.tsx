"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, http } from "wagmi";
import { createDexChainFromEnv } from "@dex-terminal/blockchain";

const dexChain = createDexChainFromEnv({
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
});

const wagmiConfig = getDefaultConfig({
  appName: "DEX Terminal",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "dex-terminal-dev",
  chains: [dexChain],
  ssr: true,
  transports: {
    [dexChain.id]: http(dexChain.rpcUrls.default.http[0]),
  },
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
