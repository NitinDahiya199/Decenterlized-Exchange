import { z } from "zod";

/** Browser-safe env (NEXT_PUBLIC_*). Validate in client entry or a small loader. */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  NEXT_PUBLIC_CHAIN_ID: z.string().optional(),
  NEXT_PUBLIC_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(input: Record<string, string | undefined>): ClientEnv {
  return clientEnvSchema.parse(input);
}

export function safeParseClientEnv(input: Record<string, string | undefined>) {
  return clientEnvSchema.safeParse(input);
}
