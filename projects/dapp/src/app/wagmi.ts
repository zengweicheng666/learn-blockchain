import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const hardhat = defineChain({
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
  autoConnect: true,
});
