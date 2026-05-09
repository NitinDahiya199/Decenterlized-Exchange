import { defineChain, type Chain } from "viem";

export const DEFAULT_PUBLIC_CHAIN_ID = 11155111;
export const DEFAULT_PUBLIC_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export type PublicChainEnv = {
  NEXT_PUBLIC_CHAIN_ID?: string | undefined;
  NEXT_PUBLIC_RPC_URL?: string | undefined;
};

export function parsePublicChainId(value: string | undefined): number {
  const chainId = Number(value ?? DEFAULT_PUBLIC_CHAIN_ID);

  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid NEXT_PUBLIC_CHAIN_ID: ${value}`);
  }

  return chainId;
}

export function createDexChain({
  chainId,
  rpcUrl,
}: {
  chainId: number;
  rpcUrl: string;
}): Chain {
  return defineChain({
    id: chainId,
    name: chainId === DEFAULT_PUBLIC_CHAIN_ID ? "Sepolia" : `DEX Devnet ${chainId}`,
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
    testnet: true,
  });
}

export function createDexChainFromEnv(env: PublicChainEnv): Chain {
  return createDexChain({
    chainId: parsePublicChainId(env.NEXT_PUBLIC_CHAIN_ID),
    rpcUrl: env.NEXT_PUBLIC_RPC_URL ?? DEFAULT_PUBLIC_RPC_URL,
  });
}
