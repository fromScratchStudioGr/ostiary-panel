"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUsername, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950 md:sticky md:top-0 md:flex md:h-screen md:self-start">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
          <Image src="/ostiary-mark.svg" alt="" width={20} height={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Ostiary
          </p>
          <p className="text-xs text-zinc-400">Admin Panel</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
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
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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

      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Signed in as
        </p>
        <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {currentUsername}
        </p>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
