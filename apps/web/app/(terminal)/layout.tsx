import { TerminalAppShell } from "@/components/terminal/terminal-app-shell";

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TerminalAppShell>{children}</TerminalAppShell>;
}
