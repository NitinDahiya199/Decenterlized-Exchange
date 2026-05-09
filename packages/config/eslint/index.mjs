import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Shared flat ESLint config for all workspaces. */
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/artifacts/**",
      "**/typechain-types/**",
      "**/coverage/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
