import type { Metadata } from "next";
import { parsePublicEnv } from "@/lib/public-env";
import { Providers } from "./providers";
import "./globals.css";

parsePublicEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_DEMO_WETH_ADDRESS: process.env.NEXT_PUBLIC_DEMO_WETH_ADDRESS,
  NEXT_PUBLIC_DEMO_USDC_ADDRESS: process.env.NEXT_PUBLIC_DEMO_USDC_ADDRESS,
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS,
  NEXT_PUBLIC_DEMO_STAKING_ADDRESS: process.env.NEXT_PUBLIC_DEMO_STAKING_ADDRESS,
});

export const metadata: Metadata = {
  title: "DEX Terminal",
  description: "Devnet-only hybrid DEX simulator — educational trading terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
