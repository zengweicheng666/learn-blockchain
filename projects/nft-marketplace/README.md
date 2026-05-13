# NFT Marketplace

Phase 3 实战项目二：全栈 NFT 市场。

## 架构

双合约设计：

| 合约 | 职责 |
|------|------|
| NFTMarketplace | 固定价格上架、购买、取消 |
| AuctionManager | 英式拍卖创建、出价、退款、结算 |
| PlatformFee (abstract) | 共享平台费逻辑 (2.5%) |

## 环境

| 项目 | 版本 |
|------|------|
| Solidity | ^0.8.28 |
| Hardhat | ^2.28 |
| OpenZeppelin | ^5.6 |

## 快速开始

```bash
npm install
npx hardhat compile
npx hardhat test
```

## 部署

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## 测试

| 文件 | 用例数 | 覆盖 |
|------|--------|------|
| PlatformFee.test.js | 10 | 费率和计算 |
| NFTMarketplace.test.js | 17 | 上架/购买/取消/费用 |
| AuctionManager.test.js | 15 | 创建/出价/退款/结算 |
| integration.test.js | 3 | 完整流程 |

## NFT 流转

### 固定价格
```
卖家 approve → listItem → NFT 托管 → buyItem → NFT 给买家，ETH 给卖家
```

### 拍卖
```
卖家 approve → createAuction → NFT 托管 → placeBid(多次) → endAuction → NFT 给赢家
```
