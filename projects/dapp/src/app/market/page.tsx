"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS, AUCTION_MANAGER_ABI, AUCTION_MANAGER_ADDRESS } from "@/lib/contracts";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MarketOverview() {
  const { data: listingCount } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "listingCount",
  });

  const { data: auctionCount } = useReadContract({
    address: AUCTION_MANAGER_ADDRESS,
    abi: AUCTION_MANAGER_ABI,
    functionName: "auctionCount",
  });

  const { data: accumulatedFees } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "accumulatedFees",
  });

  const { data: platformFee } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "platformFee",
  });

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Active Listings" value={listingCount?.toString() ?? "---"} />
      <StatCard label="Active Auctions" value={auctionCount?.toString() ?? "---"} />
      <StatCard
        label="Accumulated Fees"
        value={accumulatedFees ? `${Number(formatEther(accumulatedFees)).toFixed(4)} ETH` : "---"}
      />
      <StatCard
        label="Platform Fee"
        value={platformFee ? `${(Number(platformFee) / 100).toFixed(2)}%` : "---"}
      />
    </div>
  );
}

export default function MarketPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-zinc-500">
        Connect your wallet to explore the NFT Marketplace.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">NFT Marketplace</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse fixed-price listings and live auctions
        </p>
      </div>

      <MarketOverview />

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/market/listings"
          className="rounded-lg border border-zinc-200 p-4 text-sm font-medium transition hover:border-blue-300 hover:text-blue-600"
        >
          Browse Listings &rarr;
        </Link>
        <Link
          href="/market/auctions"
          className="rounded-lg border border-zinc-200 p-4 text-sm font-medium transition hover:border-blue-300 hover:text-blue-600"
        >
          Browse Auctions &rarr;
        </Link>
        <Link
          href="/market/my"
          className="rounded-lg border border-zinc-200 p-4 text-sm font-medium transition hover:border-blue-300 hover:text-blue-600"
        >
          My Items &rarr;
        </Link>
      </div>
    </div>
  );
}
