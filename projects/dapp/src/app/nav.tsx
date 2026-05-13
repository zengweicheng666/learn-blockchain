"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";
import { useContracts } from "@/lib/contracts";

const ALL_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dao", label: "DAO", module: "dao" as const },
  { href: "/stake", label: "Stake", module: "stake" as const },
  { href: "/market", label: "Market", module: "market" as const },
];

export function Nav() {
  const pathname = usePathname();
  const { availableModules } = useContracts();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-zinc-800">Blockchain DApp</span>
        <div className="flex items-center gap-4">
          {ALL_LINKS.map((link) => {
            const isAvailable = !link.module || availableModules.includes(link.module);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition ${
                  !isAvailable ? "pointer-events-none text-zinc-300" :
                  pathname === link.href
                    ? "font-medium text-blue-600"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                title={!isAvailable ? "Not available on this network" : link.label}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      <ConnectButton />
    </nav>
  );
}
