# NFT Marketplace Design

Week 13-16 实战项目二：NFT 市场。支持固定价格交易和英式拍卖，全栈 DApp 实现。

## 架构概览

```
┌─────────────┐    ┌──────────────┐
│ 链上 Layer  │    │  前端 Layer   │
│             │    │              │
│ MyNFT       │    │ /market      │
│ (任意 ERC721) │    │ ├── page.tsx  │
│             │    │ ├── listings  │
│ NFTMarket   │    │ ├── auctions  │
│ place.sol   │    │ └── my        │
│             │    │              │
│ Auction     │    │ Wagmi Hooks  │
│ Manager.sol │    │ + TxStatus   │
└──────┬──────┘    └──────┬───────┘
       │                  │
       └──── Hardhat ─────┘
       Localhost:8545    Localhost:3000
```

## 合约架构

```
contracts/
├── interfaces/
│   ├── IMarketplace.sol
│   └── IAuctionManager.sol
├── abstract/
│   └── PlatformFee.sol
├── NFTMarketplace.sol
└── AuctionManager.sol
```

### PlatformFee（抽象合约）

两个市场合约共用的平台费逻辑：

- `platformFee` — 费率（bps，如 250 = 2.5%）
- `feeRecipient` — 费用接收地址（合约 owner）
- `calculateFee(amount)` → `(feeAmount, netAmount)` — 内部计算
- `setPlatformFee(newFee)` — onlyOwner
- `withdrawFees()` — onlyOwner，提取累计平台费

固定价格交易：买家支付 `price + fee`，卖家实收 `price`
拍卖交易：赢家付 `finalBid`，卖家实收 `finalBid - fee`

### NFTMarketplace.sol

管理固定价格上架和购买。

**Listing 结构：**
```
seller         address
nftContract    address
tokenId        uint256
price          uint256
active         bool
```

**函数：**

| 函数 | 可见性 | 逻辑 |
|------|--------|------|
| `listItem(nft, tokenId, price)` | external | 校验 NFT 授权 → transferFrom 托管 → 创建 Listing |
| `buyItem(listingId)` | external payable | 校验金额 → 校验上架有效 → transfer NFT 给买家 → 结算费用 |
| `cancelListing(listingId)` | external | 仅卖家 → NFT 退回 → 下架 |

### AuctionManager.sol

管理英式拍卖（与 Phase 2 Auction 合约模式一致，但集成到市场体系）。

**函数：**

| 函数 | 可见性 | 逻辑 |
|------|--------|------|
| `createAuction(nft, tokenId, startBid, duration)` | external | 托管 NFT → 创建拍卖 |
| `placeBid(auctionId)` | external payable | 校验出价 ≥ 起拍价且 > 当前最高 → 记入前最高出价者退款 → 更新最高 |
| `withdrawBid(auctionId)` | external | Pull 模式：被超出的竞拍者取回资金 |
| `endAuction(auctionId)` | external | 校验时间到 → 有人出价则 NFT 给赢家 + 结算费用，无人出价则 NFT 退还卖家 |

## 前端页面

### 路由

```
/market           市场主页（平台统计）
/market/listings  固定价格 NFT 列表
/market/auctions  拍卖列表
/market/my        我的 NFT（持有/上架/出价）
```

### 组件

- `NftCard` — NFT 卡片：图片、名称、价格/拍卖信息、操作按钮
- `ListingForm` — 上架弹窗：选择 NFT → 输入价格 → approve → list
- `AuctionForm` — 创建拍卖弹窗：选择 NFT → 起拍价 → 持续时间
- `TxStatus` — 复用现有组件

## 数据流

### 固定价格流程

```
用户 A (卖家)                        用户 B (买家)
1. approve(market, tokenId) ──┐
2. listItem(nft, tokenId, price)  │  NFT → 市场托管
                                │
3. buyItem(listingId) ───────────┤  ETH → 市场
4.                                │  NFT → 用户 B
5.                                │  ETH(扣费) → 用户 A
```

### 拍卖流程

```
用户 A (卖家)                        用户 B/C (竞拍者)
1. approve(auctionMgr, tokenId) ─┐
2. createAuction(...)            │  NFT → 拍卖托管
                                │
3. placeBid() ──────────────────┤  ETH → 合约（记录）
4. 被超出 → withdrawBid() ───────┤  ETH 退回
5. endAuction() ────────────────┤  NFT → 赢家, ETH(扣费) → 卖家
```

## 测试计划

### NFTMarketplace（~15 个用例）

| 分组 | 用例 |
|------|------|
| Listing | 正常上架、重复上架、未授权、价格=0 |
| Buying | 正常购买、金额不足、下架后购买、自己买自己的 |
| Cancel | 卖家取消、非卖家取消、已卖出后取消 |
| Fee | 平台费计算验证 |

### AuctionManager（~15 个用例）

| 分组 | 用例 |
|------|------|
| Create | 正常创建、重复创建、时长=0 |
| Bid | 正常出价、低于起拍价、低于最高价、卖家不能出价 |
| Withdraw | 被超出后提取退款 |
| End | 正常结算、无人出价退还、提前结束 |

### 集成（~5 个用例）

完整流程：mint → approve → list → buy / auction → settle
多用户并发出价

## 项目结构

```
projects/nft-marketplace/
├── contracts/
│   ├── interfaces/
│   │   ├── IMarketplace.sol
│   │   └── IAuctionManager.sol
│   ├── abstract/
│   │   └── PlatformFee.sol
│   ├── NFTMarketplace.sol
│   └── AuctionManager.sol
├── test/
│   ├── NFTMarketplace.test.js
│   ├── AuctionManager.test.js
│   └── integration.test.js
├── scripts/
│   └── deploy.js
├── hardhat.config.js
├── package.json
└── README.md
```
