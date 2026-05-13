"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useContracts, AUCTION_MANAGER_ABI } from "@/lib/contracts";

function TxStatus({ status }: { status: "idle" | "pending" | "confirmed" | "error" }) {
  if (status === "idle") return null;
  return (
    <p className={`mt-2 text-xs ${status === "error" ? "text-red-600" : "text-green-600"}`}>
      {status === "pending" ? "Waiting for confirmation..." : status === "confirmed" ? "Confirmed!" : "Failed or rejected."}
    </p>
  );
}

function CreateAuctionForm({ auctionMgr }: { auctionMgr: { address: `0x${string}`; abi: typeof AUCTION_MANAGER_ABI } }) {
  const [nftContract, setNftContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [duration, setDuration] = useState("86400");
  const [status, setStatus] = useState<"idle" | "pending" | "confirmed" | "error">("idle");

  const { writeContractAsync } = useWriteContract();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nftContract || !tokenId || !startingBid) return;

    setStatus("pending");
    try {
      await writeContractAsync({
        address: auctionMgr.address,
        abi: auctionMgr.abi,
        functionName: "createAuction",
        args: [nftContract as `0x${string}`, BigInt(tokenId), parseEther(startingBid), BigInt(duration)],
      });
      setStatus("confirmed");
      setNftContract("");
      setTokenId("");
      setStartingBid("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleCreate} className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Create Auction</h3>
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
          placeholder="Starting Bid (ETH)"
          value={startingBid}
          onChange={(e) => setStartingBid(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          type="number"
          min="1"
          placeholder="Duration (seconds)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <span className="text-xs text-zinc-500">seconds</span>
      </div>
      <button
        type="submit"
        disabled={status === "pending"}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Create Auction
      </button>
      <TxStatus status={status} />
    </form>
  );
}

function LookupAuction({ auctionMgr }: { auctionMgr: { address: `0x${string}`; abi: typeof AUCTION_MANAGER_ABI } }) {
  const [auctionId, setAuctionId] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [actionStatus, setActionStatus] = useState<"idle" | "pending" | "confirmed" | "error">("idle");
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: auction, refetch } = useReadContract({
    address: auctionMgr.address,
    abi: auctionMgr.abi,
    functionName: "getAuction",
    args: auctionId ? [BigInt(auctionId)] : undefined,
    query: { enabled: !!auctionId },
  });

  const { data: pendingReturn } = useReadContract({
    address: auctionMgr.address,
    abi: auctionMgr.abi,
    functionName: "getPendingReturn",
    args: auctionId && address ? [BigInt(auctionId), address] : undefined,
    query: { enabled: !!auctionId && !!address },
  });

  const handleBid = async () => {
    if (!auctionId || !bidAmount) return;
    setActionStatus("pending");
    try {
      await writeContractAsync({
        address: auctionMgr.address,
        abi: auctionMgr.abi,
        functionName: "placeBid",
        args: [BigInt(auctionId)],
        value: parseEther(bidAmount),
      });
      setActionStatus("confirmed");
      refetch();
    } catch {
      setActionStatus("error");
    }
  };

  const handleEnd = async () => {
    if (!auctionId) return;
    setActionStatus("pending");
    try {
      await writeContractAsync({
        address: auctionMgr.address,
        abi: auctionMgr.abi,
        functionName: "endAuction",
        args: [BigInt(auctionId)],
      });
      setActionStatus("confirmed");
      refetch();
    } catch {
      setActionStatus("error");
    }
  };

  const handleWithdraw = async () => {
    if (!auctionId) return;
    setActionStatus("pending");
    try {
      await writeContractAsync({
        address: auctionMgr.address,
        abi: auctionMgr.abi,
        functionName: "withdrawBid",
        args: [BigInt(auctionId)],
      });
      setActionStatus("confirmed");
      refetch();
    } catch {
      setActionStatus("error");
    }
  };

  const isEnded = auction?.[6] && Number(auction[6]) * 1000 < Date.now();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Lookup Auction by ID</h3>
      <input
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        type="number"
        min="0"
        placeholder="Auction ID"
        value={auctionId}
        onChange={(e) => setAuctionId(e.target.value)}
      />

      {auction && (
        <div className="rounded bg-zinc-50 p-3 text-xs space-y-1">
          <p><span className="font-medium">Seller:</span> {auction[0]}</p>
          <p><span className="font-medium">NFT Contract:</span> {auction[1]}</p>
          <p><span className="font-medium">Token ID:</span> {auction[2].toString()}</p>
          <p><span className="font-medium">Starting Bid:</span> {formatEther(auction[3])} ETH</p>
          <p><span className="font-medium">Highest Bid:</span> {auction[5] > 0n ? `${formatEther(auction[5])} ETH` : "None"}</p>
          <p><span className="font-medium">Highest Bidder:</span> {auction[4] !== "0x0000000000000000000000000000000000000000" ? auction[4] : "None"}</p>
          <p><span className="font-medium">Active:</span> {auction[7] ? "Yes" : "No"}</p>
          <p><span className="font-medium">Ended:</span> {auction[8] ? "Yes" : "No"}</p>
          <p><span className="font-medium">End Time:</span> {new Date(Number(auction[6]) * 1000).toLocaleString()}</p>

          {pendingReturn && pendingReturn > 0n && (
            <p className="text-purple-700">
              <span className="font-medium">Your pending refund:</span> {formatEther(pendingReturn)} ETH
            </p>
          )}

          {auction[7] && !auction[8] && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Bid amount (ETH)"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <button
                  onClick={handleBid}
                  disabled={actionStatus === "pending"}
                  className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Place Bid
                </button>
              </div>
              {isEnded && (
                <button
                  onClick={handleEnd}
                  disabled={actionStatus === "pending"}
                  className="rounded bg-orange-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  End Auction
                </button>
              )}
            </div>
          )}

          {pendingReturn && pendingReturn > 0n && (
            <button
              onClick={handleWithdraw}
              disabled={actionStatus === "pending"}
              className="mt-2 rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              Withdraw Refund ({formatEther(pendingReturn)} ETH)
            </button>
          )}
        </div>
      )}
      <TxStatus status={actionStatus} />
    </div>
  );
}

function NetworkWarning() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
      Auction contracts are only deployed on <strong>Hardhat Local</strong>. Switch your wallet network.
    </div>
  );
}

export default function AuctionsPage() {
  const { isConnected } = useAccount();
  const { auctionManager, hasAuction, chainName } = useContracts();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Auctions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create new auctions or bid on existing ones ({chainName})
        </p>
      </div>

      {!isConnected ? (
        <p className="text-center text-sm text-zinc-400">
          Connect your wallet to create or bid on auctions.
        </p>
      ) : !hasAuction ? (
        <NetworkWarning />
      ) : (
        <>
          <CreateAuctionForm auctionMgr={auctionManager} />
          <LookupAuction auctionMgr={auctionManager} />
        </>
      )}
    </div>
  );
}