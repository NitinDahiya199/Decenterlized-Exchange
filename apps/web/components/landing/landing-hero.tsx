"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const metrics = [
  { label: "Live surfaces", value: "9", detail: "Trade, swap, LP, staking, portfolio, settings and more" },
  { label: "Hybrid latency", value: "<1s", detail: "Off-chain matching with instant UI feedback" },
  { label: "Devnet actions", value: "4", detail: "Swap, add LP, remove LP, stake and claim rewards" },
];

const features = [
  {
    title: "Pro trading workspace",
    description:
      "Resizable panels, live order book, candlestick chart, recent tape, open orders, and guarded keyboard shortcuts.",
    accent: "from-cyan-400/25 to-blue-500/10",
    icon: "workspace",
  },
  {
    title: "Wallet verified sessions",
    description:
      "Users prove wallet ownership with signed messages before writing orders or linking account state.",
    accent: "from-violet-400/25 to-fuchsia-500/10",
    icon: "wallet",
  },
  {
    title: "On-chain playground",
    description:
      "Sepolia demo tokens, AMM router, LP share accounting, and staking rewards without touching real funds.",
    accent: "from-emerald-400/25 to-cyan-500/10",
    icon: "chain",
  },
  {
    title: "Indexer and audit trail",
    description:
      "A viem worker backfills and watches contract events, then records transactions and audit logs in Prisma.",
    accent: "from-amber-400/25 to-orange-500/10",
    icon: "indexer",
  },
  {
    title: "Production-minded backend",
    description:
      "Fastify APIs, Prisma models, Redis-ready rate limiting, Socket.IO scaling, and health checks.",
    accent: "from-rose-400/25 to-violet-500/10",
    icon: "backend",
  },
  {
    title: "Portfolio clarity",
    description:
      "Simulated trading balances stay clearly separate from devnet LP and staking positions.",
    accent: "from-sky-400/25 to-emerald-500/10",
    icon: "portfolio",
  },
];

const stack = ["Next.js", "Fastify", "Prisma", "Socket.IO", "Wagmi", "Viem", "Hardhat", "Redis"];

const timeline = [
  "Connect wallet and sign a one-time verification message.",
  "Watch live market data stream into the terminal header and panels.",
  "Place simulated limit or market orders against the off-chain matcher.",
  "Sign Sepolia swap, liquidity, or staking transactions from the same workspace.",
  "Let the indexer record on-chain activity back into the database.",
];

function GlowCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function FeatureIcon({ icon }: { icon: string }) {
  const common = "stroke-current";

  return (
    <div className="relative mb-8 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 text-cyan-200 shadow-2xl shadow-black/30 transition group-hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/[0.02] to-transparent" />
      <div className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-cyan-400/20 blur-lg" />
      <svg viewBox="0 0 48 48" aria-hidden className="relative h-8 w-8">
        {icon === "workspace" ? (
          <>
            <rect x="8" y="10" width="32" height="24" rx="4" className={common} fill="none" strokeWidth="2.8" />
            <path d="M14 18h10M14 25h7M27 18h7M26 25h8M19 39h10M24 34v5" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" />
          </>
        ) : null}
        {icon === "wallet" ? (
          <>
            <path d="M10 16.5A5.5 5.5 0 0 1 15.5 11H35a3 3 0 0 1 3 3v20a4 4 0 0 1-4 4H15.5A5.5 5.5 0 0 1 10 32.5v-16Z" className={common} fill="none" strokeWidth="2.8" />
            <path d="M31 23h8v8h-8a4 4 0 0 1 0-8Z" className={common} fill="none" strokeWidth="2.8" />
            <circle cx="32" cy="27" r="1.5" fill="currentColor" />
          </>
        ) : null}
        {icon === "chain" ? (
          <>
            <path d="M18.5 28.5 14 33a6 6 0 0 1-8.5-8.5l6-6A6 6 0 0 1 20 27" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M29.5 19.5 34 15a6 6 0 0 1 8.5 8.5l-6 6A6 6 0 0 1 28 21" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" />
            <path d="m18 30 12-12" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" />
          </>
        ) : null}
        {icon === "indexer" ? (
          <>
            <path d="M10 14h28M10 24h28M10 34h28" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="16" cy="14" r="3" fill="currentColor" />
            <circle cx="30" cy="24" r="3" fill="currentColor" />
            <circle cx="22" cy="34" r="3" fill="currentColor" />
          </>
        ) : null}
        {icon === "backend" ? (
          <>
            <rect x="9" y="9" width="30" height="10" rx="3" className={common} fill="none" strokeWidth="2.8" />
            <rect x="9" y="29" width="30" height="10" rx="3" className={common} fill="none" strokeWidth="2.8" />
            <path d="M17 19v10M31 19v10M16 14h.01M16 34h.01" className={common} fill="none" strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : null}
        {icon === "portfolio" ? (
          <>
            <path d="M12 36V18M24 36V10M36 36V25" className={common} fill="none" strokeWidth="3" strokeLinecap="round" />
            <path d="M9 38h30" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" />
            <path d="m12 18 12-8 12 15" className={common} fill="none" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </svg>
    </div>
  );
}

export function LandingHero() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_5%,rgba(124,58,237,0.2),transparent_28%),radial-gradient(circle_at_50%_70%,rgba(16,185,129,0.08),transparent_35%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="sticky top-4 z-50 mb-16"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/55 p-2 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_50%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_88%_40%,rgba(124,58,237,0.18),transparent_26%)]" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
            <div className="relative flex items-center justify-between gap-4">
              <Link href="/" className="group flex items-center gap-3 rounded-2xl px-2 py-1.5">
                <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-base font-black text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.65),transparent_28%)]" />
                  <span className="relative">D</span>
                </span>
                <span>
                  <span className="block text-sm font-semibold tracking-tight text-white transition group-hover:text-cyan-100">
                    DEX Terminal
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                    Devnet live
                  </span>
                </span>
              </Link>

              <div className="hidden rounded-2xl border border-white/10 bg-black/20 p-1 md:flex">
                {[
                  ["Features", "#features"],
                  ["Architecture", "#architecture"],
                  ["Workflow", "#workflow"],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[11px] font-medium text-emerald-200 lg:inline-flex">
                  No real funds
                </span>
                <Link
                  href="/trade"
                  className="group rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
                >
                  Launch app
                  <span className="ml-2 inline-block transition group-hover:translate-x-0.5">-&gt;</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-cyan-200/80 shadow-lg shadow-cyan-950/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
              Hybrid web3 trading simulator
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl lg:text-8xl">
              A trading terminal that feels like a command center.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              Charts, live order book, wallet verification, simulated matching, devnet swaps,
              liquidity, staking, portfolio insights, and an event indexer, all shaped into one
              cinematic desktop-first exchange experience.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/trade"
                className="group rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-cyan-500/20 transition hover:scale-[1.02]"
              >
                Open terminal
                <span className="ml-2 opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100">
                  -&gt;
                </span>
              </Link>
              <Link
                href="/swap"
                className="rounded-2xl border border-white/15 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                Try devnet swap
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <GlowCard key={metric.label} className="p-4">
                  <div className="text-3xl font-semibold tracking-tight text-white">{metric.value}</div>
                  <div className="mt-1 text-xs font-medium text-zinc-300">{metric.label}</div>
                  <div className="mt-2 text-[11px] leading-5 text-zinc-500">{metric.detail}</div>
                </GlowCard>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-violet-500/10 to-emerald-500/10 blur-2xl" />
            <GlowCard className="relative overflow-hidden p-4">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">ETH / USDC</p>
                  <p className="mt-1 text-2xl font-semibold text-white">3,024.82</p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  Live
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-4 flex items-end gap-2">
                    {[36, 52, 42, 66, 58, 78, 61, 92, 73, 86, 69, 98].map((height, index) => (
                      <motion.span
                        key={index}
                        initial={{ height: 20 }}
                        animate={{ height }}
                        transition={{ duration: 0.8, delay: index * 0.04, ease: "easeOut" }}
                        className="w-full rounded-t-md bg-gradient-to-t from-cyan-500/30 to-cyan-300/80"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] text-zinc-600">
                    <span>09:00</span>
                    <span>12:00</span>
                    <span>15:00</span>
                    <span>18:00</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[11px]">
                  <div className="mb-3 flex justify-between text-zinc-500">
                    <span>Price</span>
                    <span>Size</span>
                  </div>
                  {["3028.4", "3027.1", "3026.5", "3025.8"].map((price, index) => (
                    <div key={price} className="flex justify-between py-1 text-rose-300/80">
                      <span>{price}</span>
                      <span className="text-zinc-500">{(1.2 + index / 3).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="my-2 rounded-lg bg-cyan-400/10 px-2 py-1 text-center text-cyan-200">
                    3024.8
                  </div>
                  {["3024.1", "3023.2", "3022.9", "3021.7"].map((price, index) => (
                    <div key={price} className="flex justify-between py-1 text-emerald-300/80">
                      <span>{price}</span>
                      <span className="text-zinc-500">{(0.8 + index / 4).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {["Verified wallet", "Redis-ready API", "Indexed events"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
                    <span className="mb-2 block h-1.5 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                    {item}
                  </div>
                ))}
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Built like a real product</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Everything a portfolio-grade exchange demo should show.
          </h2>
          <p className="mt-5 text-zinc-400">
            Not just buttons on a page. This is a full-stack trading surface with APIs, sockets,
            contracts, wallet sessions, indexer reliability, and production-minded guardrails.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <GlowCard key={feature.title} className="group relative overflow-hidden p-6 transition hover:-translate-y-1 hover:border-white/20">
              <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${feature.accent} opacity-70 blur-2xl transition group-hover:opacity-100`} />
              <div className="relative">
                <FeatureIcon icon={feature.icon} />
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.description}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      <section id="architecture" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">Hybrid architecture</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Fast where it should be fast. On-chain where it should be signed.
            </h2>
            <p className="mt-5 text-sm leading-7 text-zinc-400">
              The matcher, order book, ticker, balances, and portfolio tables stay in your API and
              database for speed. Swaps, liquidity, and staking only touch the devnet when the user
              signs a wallet transaction.
            </p>
          </div>
          <GlowCard className="p-5">
            <div className="grid gap-3 md:grid-cols-4">
              {["Web terminal", "Fastify API", "Postgres + Redis", "Sepolia contracts"].map((item, index) => (
                <div key={item} className="relative rounded-2xl border border-white/10 bg-black/25 p-4">
                  <span className="text-[10px] text-zinc-600">0{index + 1}</span>
                  <h3 className="mt-6 text-sm font-semibold text-white">{item}</h3>
                  <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-cyan-400/80 to-violet-500/80" />
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              {stack.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs text-zinc-400">
                  {item}
                </span>
              ))}
            </div>
          </GlowCard>
        </div>
      </section>

      <section id="workflow" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
        <GlowCard className="overflow-hidden">
          <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Demo journey</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                A reviewer can feel the whole system in minutes.
              </h2>
              <p className="mt-5 text-sm leading-7 text-zinc-400">
                The landing page leads directly into a guided product story: connect, verify,
                trade, sign devnet actions, and see activity flow back into the app.
              </p>
            </div>
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xs font-semibold text-cyan-200">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-emerald-500/10 p-8 text-center shadow-2xl shadow-cyan-950/20 md:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_35%)]" />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Ready for launch</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Open the terminal and make the demo move.
            </h2>
            <p className="mt-5 text-zinc-400">
              No real funds. No hidden keys. Just a polished full-stack exchange simulator that
              shows how frontend, backend, realtime data, contracts, and indexing connect.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/trade"
                className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-cyan-100"
              >
                Enter trading terminal
              </Link>
              <Link
                href="/portfolio"
                className="rounded-2xl border border-white/20 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
              >
                View portfolio
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-600">
          Educational devnet build. Simulated trading balances are not real funds.
        </p>
      </section>
    </main>
  );
}
