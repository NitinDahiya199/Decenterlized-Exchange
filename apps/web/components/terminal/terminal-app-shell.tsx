"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMarketSocket } from "@/hooks/use-market-socket";
import { useWalletLink } from "@/hooks/use-wallet-link";
import { TERMINAL_NAV } from "./nav";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function TerminalAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { connected, ticker } = useMarketSocket("ETH-USDC");
  const walletLink = useWalletLink();
  const lastPrice = ticker?.lastPrice ?? "—";

  return (
    <div className="flex min-h-screen bg-[#070708] text-zinc-100">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-5">
          <Link href="/" className="block font-semibold tracking-tight text-zinc-50">
            DEX Terminal
          </Link>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-zinc-500">
            Hybrid · Devnet
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {TERMINAL_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "group relative rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/15 to-violet-500/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative font-medium">{item.label}</span>
                <span className="relative mt-0.5 block text-[11px] text-zinc-500 group-hover:text-zinc-400">
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 text-[10px] leading-relaxed text-zinc-600">
          Simulator only — no real funds. On-chain actions use your devnet wallet.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-cyan-300/90">
              ETH / USDC
            </span>
            <span className="text-xs text-zinc-500">Last · {lastPrice}</span>
            <span
              className={`hidden text-xs sm:inline ${
                connected ? "text-emerald-400/90" : "text-zinc-500"
              }`}
            >
              {connected ? "● Live (mock)" : "● Connecting"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {walletLink.linked ? (
              <span className="hidden text-[11px] text-cyan-300/80 md:inline">Session linked</span>
            ) : null}
            {walletLink.error ? (
              <span className="hidden max-w-48 truncate text-[11px] text-rose-300/80 md:inline">
                {walletLink.error}
              </span>
            ) : null}
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
