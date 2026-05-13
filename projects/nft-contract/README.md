# NFT 铸造合约（ERC721）

ERC721 NFT 合约，支持白名单铸造和公开销售。

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

`contracts/MyNFT.sol`

| 功能 | 说明 |
|------|------|
| `whitelistMint()` | 白名单地址免费铸造 |
| `publicSaleMint()` | 公开销售铸造（0.01 ETH） |
| `reserveMint(to, amount)` | Owner 预留铸造 |
| 常量 | MAX_SUPPLY=10000, MAX_PER_WALLET=5 |
