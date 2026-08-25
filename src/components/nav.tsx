"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/pantry", label: "Pantry" },
  { href: "/recipes", label: "Recipes" },
  { href: "/match", label: "Match" },
  { href: "/grocery", label: "Grocery List" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-[#0d0f0d]">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-3">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex items-center gap-2 rounded-md px-3 py-2 font-[family-name:var(--font-ibm-plex-sans)] text-sm transition-colors"
              style={{
                color: active ? "#6fcf97" : "#9ca3af",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-shadow"
                style={{
                  backgroundColor: active ? "#6fcf97" : "#3f3f46",
                  boxShadow: active ? "0 0 6px #6fcf97" : "none",
                }}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}