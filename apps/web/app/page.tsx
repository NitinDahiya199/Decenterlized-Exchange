import { uiPackageName } from "@dex-terminal/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm uppercase tracking-widest text-zinc-500">
        {uiPackageName()}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        DEX Terminal scaffold
      </h1>
      <p className="max-w-md text-center text-zinc-400">
        Next.js + Turborepo monorepo. Trading UI comes in later slices.
      </p>
    </main>
  );
}
