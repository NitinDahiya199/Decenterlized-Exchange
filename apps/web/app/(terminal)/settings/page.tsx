import type { Metadata } from "next";
import { GlassPanel } from "@/components/terminal/glass-panel";

export const metadata: Metadata = {
  title: "Settings · DEX Terminal",
  description: "RPC, chain, and session preferences.",
};

function publicValue(value: string | undefined) {
  return value && value.length > 0 ? value : "not set";
}

function chainName(chainId: string | undefined) {
  if (chainId === "11155111") {
    return "Sepolia";
  }

  return chainId ? `Custom devnet ${chainId}` : "Unknown";
}

export default function SettingsPage() {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <GlassPanel title="Network" subtitle="From NEXT_PUBLIC_* env">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Chain</dt>
            <dd className="font-mono text-zinc-300">{chainName(chainId)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Chain ID</dt>
            <dd className="font-mono text-zinc-300">{publicValue(chainId)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">RPC</dt>
            <dd className="truncate font-mono text-xs text-zinc-400">{publicValue(rpcUrl)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">API</dt>
            <dd className="truncate font-mono text-xs text-zinc-400">{publicValue(apiUrl)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">WebSocket</dt>
            <dd className="truncate font-mono text-xs text-zinc-400">{publicValue(wsUrl)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-zinc-600">
          Values resolve from public env only. Keep private keys and server secrets out of
          NEXT_PUBLIC_* variables.
        </p>
        <a
          href="https://chainlist.org/chain/11155111"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-[11px] font-medium text-cyan-300/80 hover:text-cyan-200"
        >
          Sepolia RPC docs
        </a>
      </GlassPanel>
      <GlassPanel title="Session" subtitle="Wallet link · SIWE later">
        <p className="text-sm text-zinc-500">
          Connecting a wallet links it to a Prisma user through an HTTP-only API session cookie.
          No private keys are ever sent to the API.
        </p>
      </GlassPanel>
    </div>
  );
}
