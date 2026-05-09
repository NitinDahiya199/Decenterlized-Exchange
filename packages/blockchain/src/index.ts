import { defineChain, type Chain } from "viem";
import deployments from "./deployments.json" with { type: "json" };

export const DEFAULT_PUBLIC_CHAIN_ID = 11155111;
export const DEFAULT_PUBLIC_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export type PublicChainEnv = {
  NEXT_PUBLIC_CHAIN_ID?: string | undefined;
  NEXT_PUBLIC_RPC_URL?: string | undefined;
  NEXT_PUBLIC_DEMO_WETH_ADDRESS?: string | undefined;
  NEXT_PUBLIC_DEMO_USDC_ADDRESS?: string | undefined;
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS?: string | undefined;
};

type DemoDexDeployment = {
  chainId: number;
  network: string;
  demoWeth: string | null;
  demoUsdc: string | null;
  demoSwapRouter: string | null;
};

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const demoSwapRouterAbi = [
  {
    type: "function",
    name: "getAmountOut",
    stateMutability: "view",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "swapExactTokensForTokens",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

type Address = `0x${string}`;

function optionalAddress(value: string | null | undefined): Address | undefined {
  return value?.startsWith("0x") ? (value as Address) : undefined;
}

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
    blockExplorers:
      chainId === DEFAULT_PUBLIC_CHAIN_ID
        ? {
            default: {
              name: "Sepolia Etherscan",
              url: "https://sepolia.etherscan.io",
            },
          }
        : undefined,
    testnet: true,
  });
}

export function createDexChainFromEnv(env: PublicChainEnv): Chain {
  return createDexChain({
    chainId: parsePublicChainId(env.NEXT_PUBLIC_CHAIN_ID),
    rpcUrl: env.NEXT_PUBLIC_RPC_URL ?? DEFAULT_PUBLIC_RPC_URL,
  });
}

export function getDemoDexAddresses(env: PublicChainEnv = {}) {
  const chainId = parsePublicChainId(env.NEXT_PUBLIC_CHAIN_ID);
  const deployment = deployments as DemoDexDeployment;
  const deployedOnActiveChain = deployment.chainId === chainId;

  return {
    demoWeth:
      optionalAddress(env.NEXT_PUBLIC_DEMO_WETH_ADDRESS) ??
      (deployedOnActiveChain ? optionalAddress(deployment.demoWeth) : undefined),
    demoUsdc:
      optionalAddress(env.NEXT_PUBLIC_DEMO_USDC_ADDRESS) ??
      (deployedOnActiveChain ? optionalAddress(deployment.demoUsdc) : undefined),
    demoSwapRouter:
      optionalAddress(env.NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS) ??
      (deployedOnActiveChain ? optionalAddress(deployment.demoSwapRouter) : undefined),
  };
}
