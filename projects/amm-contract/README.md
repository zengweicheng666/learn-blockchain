# AMM 去中心化交易所

恒定乘积做市商（x * y = k），支持双代币池的添加/移除流动性和兑换。

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
| `SimpleAMM.sol` | AMM 主合约（LP 代币 + 兑换 + 0.3% 手续费） |
| `TestToken.sol` | 测试用 ERC20 |

### 核心公式

- **恒定乘积:** `reserveA * reserveB = k`
- **兑换（含 0.3% 费）:** `Δout = reserveOut * (Δin * 997/1000) / (reserveIn + Δin * 997/1000)`
- **LP 份额:** 首次 `sqrt(a*b)`，后续按比例
