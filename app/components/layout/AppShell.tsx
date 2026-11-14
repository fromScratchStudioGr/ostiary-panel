"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "./nav-items";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-white p-4 dark:bg-zinc-950">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                  <Image src="/ostiary-mark.svg" alt="" width={20} height={18} />
                </span>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Ostiary
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                if (item.children) {
                  const parentActive = pathname.startsWith(item.href);
                  return (
                    <div key={item.href} className="flex flex-col gap-1">
                      <div
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                          parentActive
                            ? "text-brand-700 dark:text-brand-400"
                            : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <div className="ml-4 flex flex-col gap-1 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                        {item.children.map((child) => {
                          const isChildActive = pathname.startsWith(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                isChildActive
                                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="cursor-pointer rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
            <Image src="/ostiary-mark.svg" alt="" width={18} height={16} />
          </span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Ostiary
          </p>
        </header>

        <main className="min-w-0 flex-1 bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:px-6 lg:px-8">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
