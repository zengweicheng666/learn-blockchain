import { useChainId } from "wagmi";

// ─── 配置说明 ─────────────────────────────────────
//
// 合约地址按链 ID 分区管理，新增网络或合约只需在 ADDRESSES 中添加：
//
//   const ADDRESSES: Record<number, Record<string, `0x${string}`>> = {
//     31337: {                                    // Hardhat local
//       MARKETPLACE: "0x5FbDB2315678...",
//       AUCTION_MANAGER: "0xe7f1725E7734...",
//     },
//     11155111: {                                 // Sepolia
//       DAO: "0x8A791620dd6260...",
//       STAKING: "0x9A9f2CCfdE556...",
//     },
//     84532: {                                    // 示例：Base Sepolia
//       MARKETPLACE: "0x...",
//     },
//   };
//
// 部署新合约后，将返回的地址填入对应网络。
// useContracts() hook 会根据钱包当前连接的链自动返回正确配置。
// 网络不支持的合约会显示 "Not available" 提示。
//
// ─── ABI 定义（不依赖链，保持不变） ───────────────────────

export const VOTE_TOKEN_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

export const DAO_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getState",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalThreshold",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "proposals",
    outputs: [
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "address", name: "target", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "startBlock", type: "uint256" },
      { internalType: "uint256", name: "endBlock", type: "uint256" },
      { internalType: "uint256", name: "forVotes", type: "uint256" },
      { internalType: "uint256", name: "againstVotes", type: "uint256" },
      { internalType: "uint256", name: "abstainVotes", type: "uint256" },
      { internalType: "bool", name: "executed", type: "bool" },
      { internalType: "bool", name: "canceled", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "target", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "string", name: "description", type: "string" },
    ],
    name: "propose",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "votingPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint8", name: "support", type: "uint8" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "proposer", type: "address" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
    ],
    name: "ProposalExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "proposalId", type: "uint256" },
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "uint8", name: "support", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "weight", type: "uint256" },
    ],
    name: "Voted",
    type: "event",
  },
] as const;

export const STAKING_ABI = [
  {inputs:[{internalType:"address",name:"_owner",type:"address"}],stateMutability:"nonpayable",type:"constructor"},
  {inputs:[],name:"accrueYield",outputs:[],stateMutability:"nonpayable",type:"function"},
  {inputs:[],name:"apr",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},
  {inputs:[{internalType:"address",name:"account",type:"address"}],name:"balanceOf",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},
  {inputs:[],name:"getExchangeRate",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},
  {inputs:[],name:"lastYieldTimestamp",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},
  {inputs:[],name:"name",outputs:[{internalType:"string",name:"",type:"string"}],stateMutability:"view",type:"function"},
  {inputs:[],name:"owner",outputs:[{internalType:"address",name:"",type:"address"}],stateMutability:"view",type:"function"},
  {inputs:[{internalType:"uint256",name:"_apr",type:"uint256"}],name:"setApr",outputs:[],stateMutability:"nonpayable",type:"function"},
  {inputs:[],name:"stake",outputs:[],stateMutability:"payable",type:"function"},
  {inputs:[],name:"symbol",outputs:[{internalType:"string",name:"",type:"string"}],stateMutability:"view",type:"function"},
  {inputs:[],name:"totalEthStaked",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},
  {inputs:[],name:"totalSupply",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},
  {inputs:[{internalType:"uint256",name:"stEthAmount",type:"uint256"}],name:"unstake",outputs:[],stateMutability:"nonpayable",type:"function"},
  {anonymous:false,inputs:[{indexed:true,internalType:"address",name:"user",type:"address"},{indexed:false,internalType:"uint256",name:"ethAmount",type:"uint256"},{indexed:false,internalType:"uint256",name:"stEthAmount",type:"uint256"}],name:"Staked",type:"event"},
  {anonymous:false,inputs:[{indexed:true,internalType:"address",name:"user",type:"address"},{indexed:false,internalType:"uint256",name:"stEthAmount",type:"uint256"},{indexed:false,internalType:"uint256",name:"ethAmount",type:"uint256"}],name:"Unstaked",type:"event"},
  {anonymous:false,inputs:[{indexed:false,internalType:"uint256",name:"yieldAmount",type:"uint256"},{indexed:false,internalType:"uint256",name:"newTotalEthStaked",type:"uint256"}],name:"YieldAccrued",type:"event"},
] as const;

export const MARKETPLACE_ABI = [
  { inputs: [{ internalType: "uint256", name: "_initialFee", type: "uint256" }], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "listingCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "price", type: "uint256" }], name: "listItem", outputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], name: "buyItem", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], name: "cancelListing", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], name: "getListing", outputs: [{ internalType: "address", name: "seller", type: "address" }, { internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "price", type: "uint256" }, { internalType: "bool", name: "active", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "platformFee", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "accumulatedFees", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_newFee", type: "uint256" }], name: "setPlatformFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdrawFees", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "listingId", type: "uint256" }, { indexed: true, internalType: "address", name: "seller", type: "address" }, { indexed: true, internalType: "address", name: "nftContract", type: "address" }, { indexed: false, internalType: "uint256", name: "tokenId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "price", type: "uint256" }], name: "Listed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "listingId", type: "uint256" }, { indexed: true, internalType: "address", name: "buyer", type: "address" }, { indexed: true, internalType: "address", name: "seller", type: "address" }, { indexed: false, internalType: "uint256", name: "price", type: "uint256" }, { indexed: false, internalType: "uint256", name: "fee", type: "uint256" }], name: "Bought", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "listingId", type: "uint256" }], name: "ListingCancelled", type: "event" },
] as const;

export const AUCTION_MANAGER_ABI = [
  { inputs: [{ internalType: "uint256", name: "_initialFee", type: "uint256" }], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "auctionCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "startingBid", type: "uint256" }, { internalType: "uint256", name: "duration", type: "uint256" }], name: "createAuction", outputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "placeBid", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "withdrawBid", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "endAuction", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "getAuction", outputs: [{ internalType: "address", name: "seller", type: "address" }, { internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "startingBid", type: "uint256" }, { internalType: "address", name: "highestBidder", type: "address" }, { internalType: "uint256", name: "highestBid", type: "uint256" }, { internalType: "uint256", name: "endTime", type: "uint256" }, { internalType: "bool", name: "active", type: "bool" }, { internalType: "bool", name: "ended", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }, { internalType: "address", name: "bidder", type: "address" }], name: "getPendingReturn", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "accumulatedFees", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "auctionId", type: "uint256" }, { indexed: true, internalType: "address", name: "seller", type: "address" }, { indexed: true, internalType: "address", name: "nftContract", type: "address" }, { indexed: false, internalType: "uint256", name: "tokenId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "startingBid", type: "uint256" }, { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" }], name: "AuctionCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "auctionId", type: "uint256" }, { indexed: true, internalType: "address", name: "bidder", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "BidPlaced", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "auctionId", type: "uint256" }, { indexed: true, internalType: "address", name: "bidder", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "BidWithdrawn", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "auctionId", type: "uint256" }, { indexed: false, internalType: "address", name: "winner", type: "address" }, { indexed: false, internalType: "uint256", name: "winningBid", type: "uint256" }, { indexed: false, internalType: "uint256", name: "fee", type: "uint256" }], name: "AuctionEnded", type: "event" },
] as const;

// ─── 链感知地址配置 ───────────────────────────────

const ADDRESSES: Record<number, Record<string, `0x${string}`>> = {
  // Hardhat 本地网络
  31337: {
    MARKETPLACE: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    AUCTION_MANAGER: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    DAO: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    VOTE_TOKEN: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    STAKING: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  },
  // Sepolia 测试网
  11155111: {
    DAO: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    VOTE_TOKEN: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    STAKING: "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
  },
};

// ─── 网络名称映射（用于 UI 提示） ───────────────────

export const CHAIN_NAMES: Record<number, string> = {
  31337: "Hardhat Local",
  11155111: "Sepolia",
};

export const CHAIN_RPC: Record<number, string> = {
  31337: "http://127.0.0.1:8545",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
};

// ─── 兼容旧版导入（默认 Hardhat 地址，保留不破坏已有代码） ──

export const DAO_ADDRESS = ADDRESSES[11155111].DAO!;
export const VOTE_TOKEN_ADDRESS = ADDRESSES[11155111].VOTE_TOKEN!;
export const STAKING_ADDRESS = ADDRESSES[11155111].STAKING!;
export const MARKETPLACE_ADDRESS = ADDRESSES[31337].MARKETPLACE!;
export const AUCTION_MANAGER_ADDRESS = ADDRESSES[31337].AUCTION_MANAGER!;

// ─── useContracts Hook ──────────────────────────

export function useContracts() {
  const chainId = useChainId();
  const addrs = ADDRESSES[chainId] ?? {};

  return {
    chainId,
    chainName: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,

    /** 当前链是否支持该合约 */
    hasDAO: !!addrs.DAO,
    hasStaking: !!addrs.STAKING,
    hasMarketplace: !!addrs.MARKETPLACE,
    hasAuction: !!addrs.AUCTION_MANAGER,

    /** 当前链所支持的合约列表（用于导航展示） */
    availableModules: [
      addrs.DAO && "dao",
      addrs.STAKING && "stake",
      addrs.MARKETPLACE && "market",
    ].filter(Boolean) as string[],

    /** 合约配置（address + abi 打包） */
    dao:      { address: addrs.DAO!, abi: DAO_ABI },
    voteToken: { address: addrs.VOTE_TOKEN!, abi: VOTE_TOKEN_ABI },
    staking:  { address: addrs.STAKING!, abi: STAKING_ABI },
    marketplace:   { address: addrs.MARKETPLACE!, abi: MARKETPLACE_ABI },
    auctionManager: { address: addrs.AUCTION_MANAGER!, abi: AUCTION_MANAGER_ABI },
  };
}
