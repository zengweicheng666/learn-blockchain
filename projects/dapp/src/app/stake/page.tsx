"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { useContracts, type STAKING_ABI } from "@/lib/contracts";
import type { Abi } from "viem";

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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StakingDashboard({ staking }: { staking: { address: `0x${string}`; abi: typeof STAKING_ABI } }) {
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  const { data: totalEthStaked } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "totalEthStaked",
  });

  const { data: apr } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "apr",
  });

  const { data: exchangeRate } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "getExchangeRate",
  });

  const { data: stEthBalance } = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard
        label="Total Value Staked"
        value={totalEthStaked ? `${Number(formatEther(totalEthStaked)).toFixed(4)} ETH` : "---"}
      />
      <StatCard
        label="APR"
        value={apr ? `${(Number(apr) / 100).toFixed(2)}%` : "---"}
      />
      <StatCard
        label="Exchange Rate"
        value={exchangeRate ? `${Number(formatEther(exchangeRate)).toFixed(6)} stETH/ETH` : "---"}
      />
      <StatCard
        label="Your stETH"
        value={stEthBalance ? `${Number(formatEther(stEthBalance)).toFixed(4)} stETH` : "---"}
      />
    </div>
  );
}

function StakeForm({ staking }: { staking: { address: `0x${string}`; abi: typeof STAKING_ABI } }) {
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirming" | "confirmed" | "error">("idle");
  const [txHash, setTxHash] = useState<string>();

  const { writeContractAsync } = useWriteContract();

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: staking.address,
        abi: staking.abi,
        functionName: "stake",
        value: parseEther(amount),
      });
      setTxHash(hash);
      setTxStatus("confirmed");
      setAmount("");
    } catch {
      setTxStatus("error");
    }
  };

  return (
    <form onSubmit={handleStake} className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Stake ETH</h3>
      <p className="text-xs text-zinc-500">Deposit ETH to receive stETH</p>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="flex items-center text-sm text-zinc-500">ETH</span>
      </div>
      <button
        type="submit"
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Stake
      </button>
      <TxStatus status={txStatus} txHash={txHash} />
    </form>
  );
}

function UnstakeForm({ staking }: { staking: { address: `0x${string}`; abi: typeof STAKING_ABI } }) {
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirming" | "confirmed" | "error">("idle");
  const [txHash, setTxHash] = useState<string>();

  const { writeContractAsync } = useWriteContract();

  const handleUnstake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: staking.address,
        abi: staking.abi,
        functionName: "unstake",
        args: [parseEther(amount)],
      });
      setTxHash(hash);
      setTxStatus("confirmed");
      setAmount("");
    } catch {
      setTxStatus("error");
    }
  };

  return (
    <form onSubmit={handleUnstake} className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Unstake stETH</h3>
      <p className="text-xs text-zinc-500">Burn stETH to withdraw ETH</p>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="flex items-center text-sm text-zinc-500">stETH</span>
      </div>
      <button
        type="submit"
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Unstake
      </button>
      <TxStatus status={txStatus} txHash={txHash} />
    </form>
  );
}

function AccrueYieldButton({ staking }: { staking: { address: `0x${string}`; abi: typeof STAKING_ABI } }) {
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirming" | "confirmed" | "error">("idle");
  const [txHash, setTxHash] = useState<string>();

  const { writeContractAsync } = useWriteContract();

  const handleAccrue = async () => {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: staking.address,
        abi: staking.abi,
        functionName: "accrueYield",
      });
      setTxHash(hash);
      setTxStatus("confirmed");
    } catch {
      setTxStatus("error");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Accrue Yield</h3>
      <p className="text-xs text-zinc-500">
        Manually trigger yield accrual (simulates validator rewards)
      </p>
      <button
        onClick={handleAccrue}
        disabled={txStatus === "pending" || txStatus === "confirming"}
        className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        Accrue Yield
      </button>
      <TxStatus status={txStatus} txHash={txHash} />
    </div>
  );
}

function EventFeed({ staking }: { staking: { address: `0x${string}`; abi: typeof STAKING_ABI } }) {
  const [events, setEvents] = useState<{ yieldAmount: string; newTotal: string }[]>([]);

  useWatchContractEvent({
    address: staking.address,
    abi: staking.abi,
    eventName: "YieldAccrued",
    onLogs(logs) {
      for (const log of logs) {
        const yieldAmount = log.args.yieldAmount;
        const newTotalEthStaked = log.args.newTotalEthStaked;
        if (yieldAmount && newTotalEthStaked) {
          setEvents((prev) => [
            {
              yieldAmount: formatEther(yieldAmount),
              newTotal: formatEther(newTotalEthStaked),
            },
            ...prev,
          ]);
        }
      }
    },
  });

  if (events.length === 0) return null;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
        Live Events (YieldAccrued)
      </p>
      <div className="space-y-1">
        {events.map((ev, i) => (
          <p key={i} className="text-xs text-purple-800">
            +{ev.yieldAmount} ETH yield | Total: {ev.newTotal} ETH
          </p>
        ))}
      </div>
    </div>
  );
}

function NetworkWarning() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
      Staking contracts are only deployed on <strong>Sepolia</strong>. Switch your wallet network.
    </div>
  );
}

export default function StakePage() {
  const { isConnected } = useAccount();
  const { staking, hasStaking } = useContracts();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Liquid Staking</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stake ETH and receive stETH that accumulates yield
        </p>
      </div>

      {!isConnected ? (
        <p className="text-center text-sm text-zinc-400">
          Connect your wallet to stake, unstake, or accrue yield.
        </p>
      ) : !hasStaking ? (
        <NetworkWarning />
      ) : (
        <>
          <StakingDashboard staking={staking} />
          <EventFeed staking={staking} />
          <div className="grid gap-6 md:grid-cols-2">
            <StakeForm staking={staking} />
            <UnstakeForm staking={staking} />
          </div>
          <AccrueYieldButton staking={staking} />
        </>
      )}
    </div>
  );
}