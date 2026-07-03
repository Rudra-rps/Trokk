"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { navItems } from "@/data";
import { useHealth } from "@/data";

export default function TopNav() {
  const pathname = usePathname();
  const { health } = useHealth();

  const statusClass = health?.status === "ok" ? "ok" : health?.status === "degraded" ? "degraded" : "down";

  return (
    <header className="sticky top-0 z-50 bg-trokk-950/90 backdrop-blur-md border-b border-trokk-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-trokk-100">
            Trokk
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-trokk-800 text-trokk-100 font-medium"
                      : "text-trokk-400 hover:text-trokk-200 hover:bg-trokk-800/50"
                  }`}
                >
                  <Icon name={item.icon as any} className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-trokk-400">
            <span className={`status-dot ${statusClass}`} />
            <span className="hidden sm:inline capitalize">{health?.status ?? "—"}</span>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="sm:hidden flex justify-around border-t border-trokk-700/50 px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 text-[11px] transition-colors ${
                isActive ? "text-trokk-100" : "text-trokk-500"
              }`}
            >
              <Icon name={item.icon as any} className="w-4 h-4" />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
