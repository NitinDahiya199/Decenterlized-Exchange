"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { TERMINAL_NAV } from "./nav";

type CommandAction = {
  id: string;
  label: string;
  hint: string;
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const actions: CommandAction[] = [
    ...TERMINAL_NAV.map((item) => ({
      id: item.href,
      label: `Go to ${item.label}`,
      hint: item.description,
      run: () => router.push(item.href),
    })),
    {
      id: "buy",
      label: "Set order side to Buy",
      hint: "Trade shortcut",
      run: () => window.dispatchEvent(new CustomEvent("trade:set-side", { detail: "BUY" })),
    },
    {
      id: "sell",
      label: "Set order side to Sell",
      hint: "Trade shortcut",
      run: () => window.dispatchEvent(new CustomEvent("trade:set-side", { detail: "SELL" })),
    },
    {
      id: "market",
      label: "Set order type to Market",
      hint: "Trade shortcut",
      run: () => window.dispatchEvent(new CustomEvent("trade:set-type", { detail: "MARKET" })),
    },
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <Command
        className="mx-auto mt-20 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <Command.Input
          autoFocus
          placeholder="Type a command or page..."
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
        />
        <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">No command found.</Command.Empty>
        <Command.List className="max-h-80 overflow-auto p-2">
          {actions.map((action) => (
            <Command.Item
              key={action.id}
              value={`${action.label} ${action.hint}`}
              onSelect={() => {
                action.run();
                setOpen(false);
              }}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-zinc-300 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
            >
              <span className="block font-medium">{action.label}</span>
              <span className="mt-0.5 block text-[11px] text-zinc-500">{action.hint}</span>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
