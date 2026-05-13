# Week 13-16：NFT 市场全栈实现

## 学习目标
- 双合约架构设计（固定价格 + 拍卖）
- PlatformFee 抽象合约复用
- 前端市场页面开发
- 45 个测试覆盖

## 合约架构

```
NFTMarketplace（固定价格）
├── listItem / buyItem / cancelListing

AuctionManager（英式拍卖）
├── createAuction / placeBid / withdrawBid / endAuction

PlatformFee（抽象）
├── calculateFee / setPlatformFee / withdrawFees
```

## 测试结果

| 文件 | 用例 | 覆盖 |
|------|------|------|
| PlatformFee.test.js | 10 | 费率初始化、计算、权限、事件 |
| NFTMarketplace.test.js | 17 | 上架/购买/取消/超额退款/平台费 |
| AuctionManager.test.js | 15 | 创建/出价/退款/结算/无出价退回 |
| integration.test.js | 3 | 完整跨合约流程 |
| **总计** | **45** | **全部通过** |

## DApp 前端

| 路由 | 功能 |
|------|------|
| `/market` | 市场总览（统计卡片） |
| `/market/listings` | 固定价格上架 + 购买/取消 |
| `/market/auctions` | 拍卖创建 + 出价/结算/退款 |
| `/market/my` | 帮助指南 |

## 关键设计决策

1. **Pull 模式退款** — 被超出的竞拍者调用 `withdrawBid` 自行取回，避免 Push 模式 gas 爆炸
2. **Basis Point 费率** — 250 bps = 2.5%，MAX_FEE = 1000（10%），owner 可动态调整
3. **任意 ERC721 支持** — 不绑定特定 NFT 合约
