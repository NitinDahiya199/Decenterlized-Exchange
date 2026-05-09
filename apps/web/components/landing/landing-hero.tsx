"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/25 via-[#070708] to-[#070708]"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex max-w-lg flex-col items-center gap-6 text-center"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          Hybrid Web3 · Devnet simulator
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
          DEX Terminal
        </h1>
        <p className="text-balance text-zinc-400">
          Desktop-first trading UI: charts, order book, swap, liquidity, and staking — backed by
          your API + Neon, with optional on-chain actions on a devnet.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/trade"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95"
          >
            Open terminal
          </Link>
          <Link
            href="/swap"
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
          >
            Swap
          </Link>
        </div>
        <p className="text-xs text-zinc-600">No real funds · educational portfolio build</p>
      </motion.div>
    </main>
  );
}
