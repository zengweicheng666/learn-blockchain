"use client";

import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { useContracts, MARKETPLACE_ABI, MARKETPLACE_ADDRESS, AUCTION_MANAGER_ABI, AUCTION_MANAGER_ADDRESS } from "@/lib/contracts";

function NetworkWarning() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center text-amber-800">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Marketplace contracts are only deployed on <strong>Hardhat Local</strong>. Switch your wallet network.
      </div>
    </div>
  );
}

export default function MyPage() {
  const { address, isConnected } = useAccount();
  const { hasMarketplace, chainName } = useContracts();

  const { data: listingCount } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "listingCount",
    query: { enabled: hasMarketplace },
  });

  const { data: auctionCount } = useReadContract({
    address: AUCTION_MANAGER_ADDRESS,
    abi: AUCTION_MANAGER_ABI,
    functionName: "auctionCount",
    query: { enabled: hasMarketplace },
  });

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-zinc-500">
        Connect your wallet to view your items.
      </div>
    );
  }

  if (!hasMarketplace) return <NetworkWarning />;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">My Items</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your listings, auctions, and pending refunds ({chainName})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Total Listings Created</p>
          <p className="mt-1 text-lg font-semibold">{listingCount?.toString() ?? "---"}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs text-zinc-500">Total Auctions Created</p>
          <p className="mt-1 text-lg font-semibold">{auctionCount?.toString() ?? "---"}</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500">
        <p className="font-medium">How to use the marketplace</p>
        <ul className="mt-3 space-y-2 text-left text-xs">
          <li><strong>List an NFT:</strong> Go to Listings tab, enter your NFT contract and token ID, set a price (ensure you&apos;ve approved the marketplace contract first).</li>
          <li><strong>Buy an NFT:</strong> Lookup a listing by ID, click Buy (price + 2.5% fee).</li>
          <li><strong>Create an Auction:</strong> Go to Auctions tab, set starting bid and duration (ensure you&apos;ve approved the auction manager contract first).</li>
          <li><strong>Bid on an Auction:</strong> Lookup an auction by ID, enter your bid amount. If outbid, withdraw your refund.</li>
          <li><strong>End an Auction:</strong> After the end time passes, anyone can call End Auction to settle it.</li>
        </ul>
      </div>
    </div>
  );
}