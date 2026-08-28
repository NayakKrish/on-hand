"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { fetchHealth } from "@/lib/client-api";

const NAV = [
  { href: "/", label: "Kitchen" },
  { href: "/tonight", label: "Tonight" },
  { href: "/saved", label: "Saved" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [dbDown, setDbDown] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHealth().then((health) => {
      if (cancelled) return;
      setDbDown(health.ok ? null : health.message ?? "Kitchen graph is unreachable.");
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-24 pt-5 sm:max-w-2xl">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-chili">
            From this kitchen
          </p>
          <Link href="/" className="font-display text-3xl leading-none text-ink">
            On Hand
          </Link>
        </div>
        <nav className="hidden gap-1 sm:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  active ? "bg-ink text-cream" : "text-ink-soft hover:bg-paper-deep"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {dbDown ? (
        <div className="mb-4 rounded-2xl border border-chili/30 bg-cream px-4 py-3 text-sm text-chili-deep">
          {dbDown}
        </div>
      ) : null}

      <div className="flex-1">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm ${
                  active ? "bg-ink text-cream" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
