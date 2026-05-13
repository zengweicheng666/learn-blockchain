"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useBlockNumber } from "wagmi";
import { useContracts } from "@/lib/contracts";

function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Connect your wallet to get started
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-sm">
      <code className="rounded-md bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
        {address}
      </code>
      {balance && (
        <p className="text-zinc-600 dark:text-zinc-400">
          Balance: {Number(balance.formatted).toFixed(4)} {balance.symbol}
        </p>
      )}
    </div>
  );
}

function ChainName() {
  const { chainName } = useContracts();
  return <p className="text-lg text-zinc-600 dark:text-zinc-400">{chainName}</p>;
}

function ChainInfo() {
  const { data: blockNumber } = useBlockNumber({ watch: true });

  return (
    <div className="flex flex-col items-center gap-1 text-xs text-zinc-500 dark:text-zinc-500">
      <p>
        Current Block:{" "}
        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
          {blockNumber?.toString() ?? "---"}
        </span>
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 bg-white px-16 py-32 dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Blockchain DApp
        </h1>
        <ChainName />

        <div className="flex flex-col items-center gap-4">
          <ConnectButton />
          <WalletInfo />
        </div>

        <ChainInfo />
      </main>
    </div>
  );
}
