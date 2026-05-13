"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from "wagmi";
import { DAO_ABI, DAO_ADDRESS } from "@/lib/contracts";

const LABELS: Record<string, string> = {
  Pending: "Pending",
  Active: "Active",
  Defeated: "Defeated",
  Succeeded: "Succeeded",
  Executed: "Executed",
  Canceled: "Canceled",
};

const STATE_COLORS: Record<string, string> = {
  Pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Active: "text-blue-600 bg-blue-50 border-blue-200",
  Defeated: "text-red-600 bg-red-50 border-red-200",
  Succeeded: "text-green-600 bg-green-50 border-green-200",
  Executed: "text-zinc-500 bg-zinc-50 border-zinc-200",
  Canceled: "text-zinc-400 bg-zinc-100 border-zinc-200",
};

function ProposalState({ state }: { state: number }) {
  const labels = ["Pending", "Active", "Defeated", "Succeeded", "Executed", "Canceled"];
  const name = labels[state] ?? "Unknown";
  const color = STATE_COLORS[name] ?? "text-zinc-500";
  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${color}`}>
      {name}
    </span>
  );
}

function TxStatus({
  status,
  txHash,
}: {
  status: "idle" | "pending" | "confirming" | "confirmed" | "error";
  txHash?: string;
}) {
  if (status === "idle") return null;

  const steps = [
    { key: "pending", label: "Sign in wallet" },
    { key: "confirming", label: "Confirming on-chain" },
    { key: "confirmed", label: "Confirmed" },
  ];

  return (
    <div className="w-full max-w-md space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Transaction Status
      </p>
      {steps.map((step) => {
        const active = status === step.key;
        const done =
          (step.key === "confirming" && (status === "confirming" || status === "confirmed")) ||
          (step.key === "confirmed" && status === "confirmed");
        return (
          <div key={step.key} className="flex items-center gap-2">
            {done ? (
              <span className="text-green-500">&#10003;</span>
            ) : active ? (
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-500" />
            ) : (
              <span className="h-3 w-3 rounded-full border border-zinc-300" />
            )}
            <span className={done || active ? "text-zinc-800" : "text-zinc-400"}>
              {step.label}
            </span>
          </div>
        );
      })}
      {status === "error" && (
        <p className="mt-2 text-red-600">Transaction failed or was rejected.</p>
      )}
      {txHash && status === "confirmed" && (
        <p className="mt-2 break-all font-mono text-xs text-zinc-500">
          Tx: {txHash}
        </p>
      )}
    </div>
  );
}

function NewProposal() {
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "confirming" | "confirmed" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string>();

  const { writeContractAsync } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !description) return;

    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: DAO_ADDRESS,
        abi: DAO_ABI,
        functionName: "propose",
        args: [target as `0x${string}`, 0n, "0x" as `0x${string}`, description],
      });
      setTxHash(hash);
      setTxStatus("confirmed");
      setTarget("");
      setDescription("");
    } catch {
      setTxStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">New Proposal</h3>
      <input
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="Target address (0x...)"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      <input
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        placeholder="Proposal description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Create Proposal
      </button>
      <TxStatus status={txStatus} txHash={txHash} />
    </form>
  );
}

function ProposalVote({ proposalId }: { proposalId: number }) {
  const { writeContractAsync } = useWriteContract();
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "confirming" | "confirmed" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string>();

  const handleVote = async (support: number) => {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: DAO_ADDRESS,
        abi: DAO_ABI,
        functionName: "vote",
        args: [BigInt(proposalId), support],
      });
      setTxHash(hash);
      setTxStatus("confirmed");
    } catch {
      setTxStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        For
      </button>
      <button
        onClick={() => handleVote(0)}
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Against
      </button>
      <button
        onClick={() => handleVote(2)}
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-zinc-500 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
      >
        Abstain
      </button>
      {txStatus !== "idle" && <TxStatus status={txStatus} txHash={txHash} />}
    </div>
  );
}

function ProposalCard({ id }: { id: number }) {
  const { data, isError, isLoading } = useReadContract({
    address: DAO_ADDRESS,
    abi: DAO_ABI,
    functionName: "proposals",
    args: [BigInt(id)],
  });

  if (isLoading) return <div className="animate-pulse rounded-lg border p-4 text-sm text-zinc-400">Loading proposal #{id}...</div>;
  if (isError || !data) return null;

  const [proposer, target, , , description, , endBlock, forVotes, againstVotes, abstainVotes, executed, canceled] = data;

  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">#{id}</span>
        <ProposalState state={executed ? 4 : canceled ? 5 : 1} />
      </div>
      <p className="mb-1 text-sm font-medium">{description}</p>
      <p className="mb-3 text-xs text-zinc-400">
        Proposer: {proposer.slice(0, 6)}...{proposer.slice(-4)}
        {" | "}End: {endBlock.toString()}
      </p>
      <div className="mb-3 flex gap-4 text-xs">
        <span className="text-green-600">For: {forVotes.toString()}</span>
        <span className="text-red-600">Against: {againstVotes.toString()}</span>
        <span className="text-zinc-500">Abstain: {abstainVotes.toString()}</span>
      </div>
      <ProposalVote proposalId={id} />
    </div>
  );
}

function ProposalList() {
  const { data: count } = useReadContract({
    address: DAO_ADDRESS,
    abi: DAO_ABI,
    functionName: "proposalCount",
  });

  const total = Number(count ?? 0);
  if (total === 0) return <p className="text-sm text-zinc-400">No proposals yet.</p>;

  const ids = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="space-y-3">
      {ids.map((id) => (
        <ProposalCard key={id} id={id} />
      ))}
    </div>
  );
}

function DaoStats() {
  const { data: votingPeriod } = useReadContract({
    address: DAO_ADDRESS,
    abi: DAO_ABI,
    functionName: "votingPeriod",
  });
  const { data: threshold } = useReadContract({
    address: DAO_ADDRESS,
    abi: DAO_ABI,
    functionName: "proposalThreshold",
  });
  const { data: count } = useReadContract({
    address: DAO_ADDRESS,
    abi: DAO_ABI,
    functionName: "proposalCount",
  });

  return (
    <div className="flex gap-6 text-sm">
      <div>
        <span className="text-zinc-500">Voting Period:</span>{" "}
        <span className="font-medium">{votingPeriod?.toString() ?? "---"} blocks</span>
      </div>
      <div>
        <span className="text-zinc-500">Threshold:</span>{" "}
        <span className="font-medium">{threshold?.toString() ?? "---"} votes</span>
      </div>
      <div>
        <span className="text-zinc-500">Proposals:</span>{" "}
        <span className="font-medium">{count?.toString() ?? "---"}</span>
      </div>
    </div>
  );
}

function EventFeed() {
  const [events, setEvents] = useState<{ id: number; description: string }[]>([]);

  useWatchContractEvent({
    address: DAO_ADDRESS,
    abi: DAO_ABI,
    eventName: "ProposalCreated",
    onLogs(logs) {
      for (const log of logs) {
        if (log.args.proposalId && log.args.description) {
          setEvents((prev) => [
            { id: Number(log.args.proposalId!), description: log.args.description! },
            ...prev,
          ]);
        }
      }
    },
  });

  if (events.length === 0) return null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
        Live Events (ProposalCreated)
      </p>
      <div className="space-y-1">
        {events.map((ev, i) => (
          <p key={i} className="text-xs text-green-800">
            Proposal #{ev.id}: {ev.description}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function DaoPage() {
  const { isConnected } = useAccount();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">DAO Governance</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Interact with SimpleDAO on Hardhat local network
        </p>
      </div>

      {isConnected ? (
        <>
          <DaoStats />
          <EventFeed />
          <NewProposal />
          <ProposalList />
        </>
      ) : (
        <p className="text-center text-sm text-zinc-400">
          Connect your wallet to create proposals and vote.
        </p>
      )}
    </div>
  );
}
