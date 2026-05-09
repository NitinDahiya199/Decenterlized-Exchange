import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().positive().default(11155111),
  NEXT_PUBLIC_RPC_URL: z.string().url().default("https://ethereum-sepolia-rpc.publicnode.com"),
  NEXT_PUBLIC_DEMO_WETH_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  NEXT_PUBLIC_DEMO_USDC_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  NEXT_PUBLIC_DEMO_SWAP_ROUTER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  NEXT_PUBLIC_DEMO_STAKING_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export function parsePublicEnv(env: Record<string, string | undefined>) {
  return publicEnvSchema.parse(env);
}
