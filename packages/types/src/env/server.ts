import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  API_ORIGIN: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
}).superRefine((env, context) => {
  if (env.NODE_ENV === "production") {
    if (env.DATABASE_URL === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL is required in production",
        path: ["DATABASE_URL"],
      });
    }
    if (env.SESSION_SECRET === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SESSION_SECRET is required in production",
        path: ["SESSION_SECRET"],
      });
    }
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function safeParseServerEnv(input: Record<string, string | undefined>) {
  return serverEnvSchema.safeParse(input);
}
