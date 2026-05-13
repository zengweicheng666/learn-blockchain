# NFT Marketplace

阶段三实战项目二：全栈 NFT 市场，支持固定价格上架和英式拍卖，前端通过 Wagmi + RainbowKit 与合约交互。

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  /market          →  Dashboard (统计数据)        │   │
│  │  /market/listings →  固定价格上架/购买            │   │
│  │  /market/auctions →  拍卖创建/出价/结算           │   │
│  │  /market/my       →  我的挂单/拍卖概览            │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↕                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Wagmi (useReadContract / useWriteContract)      │   │
│  │  viem (formatEther / parseEther)                 │   │
│  │  RainbowKit (ConnectButton)                      │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│               Smart Contracts (Solidity)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  NFTMarketplace (固定价格)     AuctionManager    │   │
│  │  ──────────────────────       ───────────────   │   │
│  │  listItem()                    createAuction()   │   │
│  │  buyItem()                     placeBid()        │   │
│  │  cancelListing()               withdrawBid()     │   │
│  │                                 endAuction()     │   │
│  └──────────┬───────────────────────────┬───────────┘   │
│             │ 继承                     │ 继承            │
│             └──────────┬────────────────┘                │
│                  ┌─────┴─────┐                          │
│                  │ PlatformFee (abstract)                │
│                  │           │                           │
│                  │ fee=250   │   (2.5%, 即 250 bps)     │
│                  │           │                           │
│                  │ calculateFee()                       │
│                  │ withdrawFees()                        │
│                  │ setPlatformFee()                      │
│                  └───────────────                        │
└─────────────────────────────────────────────────────────┘
```

### 双合约设计

| 合约 | 职责 | 继承 |
|------|------|------|
| `NFTMarketplace` | 固定价格上架、购买、取消 | PlatformFee + ReentrancyGuard |
| `AuctionManager` | 英式拍卖创建、出价、退款、结算 | PlatformFee + ReentrancyGuard |
| `PlatformFee` | 共享平台费逻辑（2.5% = 250 bps） | Ownable |

两个业务合约共享同一套费用逻辑，通过继承 `PlatformFee` 实现，避免代码重复。

### 接口定义

- `IMarketplace` — Listing 结构体 + 3 个事件（Listed/Bought/ListingCancelled）+ 5 个函数
- `IAuctionManager` — 4 个事件（AuctionCreated/BidPlaced/BidWithdrawn/AuctionEnded）+ 4 个函数

## 用户流程

### 固定价格

```
卖家                                        买家
 │                                          │
 ├─ 1. approve(NFTMarketplace, tokenId)     │
 ├─ 2. listItem(nft, tokenId, price)        │
 │    → NFT 托管到合约地址                    │
 │                                           │
 │                             3. buyItem(listingId)
 │                                → 支付 price + 2.5% fee
 │                                → NFT 转给买家
 │                                → ETH 转给卖家（扣费后）
 │                                → 多余 ETH 退还
 │
 ├─ (可选) cancelListing(listingId)
 │    → NFT 退还给卖家
```

### 拍卖

```
卖家                                        买家
 │                                          │
 ├─ 1. approve(AuctionManager, tokenId)     │
 ├─ 2. createAuction(nft, tokenId,          │
 │     startingBid, duration)               │
 │    → NFT 托管                              │
 │                                           │
 │                             3. placeBid(auctionId)
 │                                → 支付出价金额
 │                                → 前一个最高出价人自动记入退款
 │
 │                              (可重复出价，被超过后可提款)
 │
 │                             4. withdrawBid(auctionId)
 │                                → 提取被超过的退款
 │
 ├─ ( anyone, 拍卖结束后 )
 │    → endAuction(auctionId)
 │    → 有出价：NFT 给赢家，ETH 给卖家（扣费）
 │    → 无出价：NFT 退还给卖家
```

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 合约语言 | Solidity | ^0.8.28 |
| EVM 版本 | Cancun | — |
| 开发框架 | Hardhat | ^2.28 |
| 测试 | Hardhat Toolbox (Mocha + Chai) | — |
| 标准库 | OpenZeppelin | ^5.6 |
| 前端框架 | Next.js | 15 |
| Web3 | Wagmi + viem + RainbowKit | — |

## 快速开始

```bash
# 安装依赖
npm install

# 编译合约
npx hardhat compile

# 运行测试（45 个用例）
npx hardhat test

# 启动本地节点
npx hardhat node
```

## 部署

### 1. 本地网络 + 前端验证

```bash
# 终端 1：启动 Hardhat 本地节点
npx hardhat node

# 终端 2：部署合约到 localhost
npx hardhat run scripts/deploy.js --network localhost

# 终端 3：部署测试 NFT 并走通完整流程
npx hardhat run scripts/verify.js --network localhost

# 启动前端
cd ../dapp
npm run dev
```

本地部署后合约地址（Hardhat 默认分配）：

| 合约 | 地址 |
|------|------|
| NFTMarketplace | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| AuctionManager | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |

### 2. 测试网部署（Sepolia）

```bash
# 在 hardhat.config.js 添加 Sepolia 网络配置
# npx hardhat run scripts/deploy.js --network sepolia
# 将返回的地址更新到 dapp/src/lib/contracts.ts
```

### 前端与合约的连接

```
dapp/src/lib/contracts.ts
├── MARKETPLACE_ADDRESS     ← NFTMarketplace 部署地址
├── AUCTION_MANAGER_ADDRESS ← AuctionManager 部署地址
├── MARKETPLACE_ABI         ← NFTMarketplace 的 ABI 片段
└── AUCTION_MANAGER_ABI     ← AuctionManager 的 ABI 片段
```

前端通过 `wagmi` 的 `useReadContract`（读）和 `useWriteContract`（写）与链上合约交互，ABI 是手动提取的合约接口片段。

### 前端路由与合约对应

| 前端页面 | 使用的合约 | 函数 |
|---------|-----------|------|
| `/market` | NFTMarketplace + AuctionManager | `listingCount`, `auctionCount`, `accumulatedFees`, `platformFee` |
| `/market/listings` | NFTMarketplace | `listItem`, `buyItem`, `cancelListing`, `getListing` |
| `/market/auctions` | AuctionManager | `createAuction`, `placeBid`, `withdrawBid`, `endAuction`, `getAuction`, `getPendingReturn` |
| `/market/my` | NFTMarketplace + AuctionManager | `listingCount`, `auctionCount` |

### 钱包配置

前端支持 Hardhat 本地网络（chain ID 31337）和 Sepolia 测试网：

```typescript
// dapp/src/app/wagmi.ts
export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],   // MetaMask 等内置钱包
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,                   // Next.js SSR 兼容
});
```

### 关键交互模式

**读取链上数据（无需 Gas）**：
```typescript
const { data: listing } = useReadContract({
  address: MARKETPLACE_ADDRESS,
  abi: MARKETPLACE_ABI,
  functionName: "getListing",
  args: [BigInt(listingId)],
});
```

**写入交易（需 Gas + 钱包签名）**：
```typescript
const { writeContractAsync } = useWriteContract();

await writeContractAsync({
  address: MARKETPLACE_ADDRESS,
  abi: MARKETPLACE_ABI,
  functionName: "buyItem",
  args: [BigInt(listingId)],
  value: price + fee,  // 附带的 ETH
});
```

## 测试

| 文件 | 用例数 | 覆盖范围 |
|------|--------|---------|
| `PlatformFee.test.js` | 10 | 费率计算、owner 权限、提款 |
| `NFTMarketplace.test.js` | 17 | 上架/购买/取消/费用计算 |
| `AuctionManager.test.js` | 15 | 拍卖创建/出价/退款/结算 |
| `integration.test.js` | 3 | 双合约完整流程连跑 |

### 运行测试

```bash
npx hardhat test                  # 全部测试
npx hardhat test test/NFTMarketplace.test.js  # 单个文件
npx hardhat coverage              # 测试覆盖率报告
```

## 合约安全设计

1. **Pull over Push** — 被超过的出价人通过 `withdrawBid()` 主动提款，而不是合约 push，防止 DoS
2. **ReentrancyGuard** — `buyItem()` 和 `endAuction()` 有重入锁保护
3. **检查-生效-交互** — 所有转移前先更新状态
4. **最高手续费上限** — `MAX_FEE = 1000`（10%），owner 也不能设置超过
5. **Ownable** — 平台费率和提款受 owner 权限控制
