export type TerminalNavItem = {
  href: string;
  label: string;
  description: string;
};

export const TERMINAL_NAV: TerminalNavItem[] = [
  { href: "/trade", label: "Trade", description: "Charts, book, orders" },
  { href: "/portfolio", label: "Portfolio", description: "Balances & PnL" },
  { href: "/swap", label: "Swap", description: "AMM-style swaps (devnet)" },
  { href: "/liquidity", label: "Liquidity", description: "Pools & LP" },
  { href: "/staking", label: "Staking", description: "Stake & rewards" },
  { href: "/settings", label: "Settings", description: "Session & RPC" },
];
