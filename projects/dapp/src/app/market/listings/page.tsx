"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useContracts, MARKETPLACE_ABI } from "@/lib/contracts";

function TxStatus({ status }: { status: "idle" | "pending" | "confirmed" | "error" }) {
  if (status === "idle") return null;
  return (
    <p className={`mt-2 text-xs ${status === "error" ? "text-red-600" : "text-green-600"}`}>
      {status === "pending" ? "Waiting for confirmation..." : status === "confirmed" ? "Confirmed!" : "Failed or rejected."}
    </p>
  );
}

function ListItemForm({ marketplace }: { marketplace: { address: `0x${string}`; abi: typeof MARKETPLACE_ABI } }) {
  const [nftContract, setNftContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "confirmed" | "error">("idle");

  const { writeContractAsync } = useWriteContract();

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nftContract || !tokenId || !price) return;

    setStatus("pending");
    try {
      await writeContractAsync({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: "listItem",
        args: [nftContract as `0x${string}`, BigInt(tokenId), parseEther(price)],
      });
      setStatus("confirmed");
      setNftContract("");
      setTokenId("");
      setPrice("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleList} className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">List NFT for Sale</h3>
      <input
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="NFT Contract Address"
        value={nftContract}
        onChange={(e) => setNftContract(e.target.value)}
      />
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          type="number"
          min="0"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          type="number"
          step="0.01"
          min="0"
          placeholder="Price in ETH"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={status === "pending"}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        List Item
      </button>
      <TxStatus status={status} />
    </form>
  );
}

function LookupListing({ marketplace }: { marketplace: { address: `0x${string}`; abi: typeof MARKETPLACE_ABI } }) {
  const [listingId, setListingId] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "confirmed" | "error">("idle");
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: listing, refetch } = useReadContract({
    address: marketplace.address,
    abi: marketplace.abi,
    functionName: "getListing",
    args: listingId ? [BigInt(listingId)] : undefined,
  });

  const handleBuy = async () => {
    if (!listing) return;
    const active = listing[4];
    if (!active) return;
    const price = listing[3];
    setStatus("pending");
    try {
      await writeContractAsync({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: "buyItem",
        args: [BigInt(listingId)],
        value: price + (price * 250n) / 10000n,
      });
      setStatus("confirmed");
      refetch();
    } catch {
      setStatus("error");
    }
  };

  const handleCancel = async () => {
    if (!listing) return;
    setStatus("pending");
    try {
      await writeContractAsync({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: "cancelListing",
        args: [BigInt(listingId)],
      });
      setStatus("confirmed");
      refetch();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Lookup Listing by ID</h3>
      <input
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        type="number"
        min="0"
        placeholder="Listing ID"
        value={listingId}
        onChange={(e) => setListingId(e.target.value)}
      />

      {listing && (
        <div className="rounded bg-zinc-50 p-3 text-xs space-y-1">
          <p><span className="font-medium">Seller:</span> {listing[0]}</p>
          <p><span className="font-medium">NFT Contract:</span> {listing[1]}</p>
          <p><span className="font-medium">Token ID:</span> {listing[2].toString()}</p>
          <p><span className="font-medium">Price:</span> {formatEther(listing[3])} ETH</p>
          <p><span className="font-medium">Active:</span> {listing[4] ? "Yes" : "No"}</p>
          {listing[4] && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleBuy}
                disabled={status === "pending"}
                className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Buy (+2.5% fee)
              </button>
              {listing[0].toLowerCase() === address?.toLowerCase() && (
                <button
                  onClick={handleCancel}
                  disabled={status === "pending"}
                  className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <TxStatus status={status} />
    </div>
  );
}

function NetworkWarning() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
      Marketplace contracts are only deployed on <strong>Hardhat Local</strong>. Switch your wallet network.
    </div>
  );
}

export default function ListingsPage() {
  const { isConnected } = useAccount();
  const { marketplace, hasMarketplace, chainName } = useContracts();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Fixed-Price Listings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          List NFTs for sale or browse existing listings ({chainName})
        </p>
      </div>

      {!isConnected ? (
        <p className="text-center text-sm text-zinc-400">
          Connect your wallet to list or buy NFTs.
        </p>
      ) : !hasMarketplace ? (
        <NetworkWarning />
      ) : (
        <>
          <ListItemForm marketplace={marketplace} />
          <LookupListing marketplace={marketplace} />
        </>
      )}
    </div>
  );
}