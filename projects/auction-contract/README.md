# 拍卖合约

ERC721 英式拍卖合约，采用 Pull over Push 退款模式。

## 环境

- Solidity: `0.8.28`（evmVersion: `cancun`）
- 框架: Hardhat `^2.28.6`
- OpenZeppelin: `^5.6.1`
- 网络: Hardhat Network（本地测试）、Sepolia（部署）

## 依赖

```bash
npm install
```

## 配置

复制 `.env.example` 为 `.env`，填入：

```
SEPOLIA_RPC_URL=<Infura / Alchemy RPC URL>
PRIVATE_KEY=<部署钱包私钥>
```

## 测试

```bash
npx hardhat test
```

## 部署

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## 合约

| 合约 | 说明 |
|------|------|
| `Auction.sol` | 英式拍卖（托管模式 + Pull over Push） |
| `TestNFT.sol` | 测试用 ERC721 |

### 拍卖流程

1. 卖家部署 → approve → `start()` 锁定 NFT
2. 竞拍者 `bid()` 出价
3. 被超出者 `withdraw()` 取回 ETH
4. 结束后 `auctionEnd()` 结算
