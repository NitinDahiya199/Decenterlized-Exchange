import type { ReactNode } from "react";

export function GlassPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-md ${className}`}
    >
      <header className="flex items-baseline justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
