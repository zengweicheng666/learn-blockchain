export const DAO_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const VOTE_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const STAKING_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

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

export const MARKETPLACE_ADDRESS = "0x...";
export const AUCTION_MANAGER_ADDRESS = "0x...";

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
