"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dao", label: "DAO" },
  { href: "/stake", label: "Stake" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-zinc-800">Blockchain DApp</span>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${
                pathname === link.href
                  ? "font-medium text-blue-600"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <ConnectButton />
    </nav>
  );
}
