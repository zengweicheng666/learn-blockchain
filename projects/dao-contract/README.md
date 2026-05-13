# DAO 投票治理合约

治理代币委托投票 + 提案创建/投票/执行系统。

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
| `VoteToken.sol` | 治理代币（ERC20 + ERC20Votes 委托投票） |
| `SimpleDAO.sol` | DAO 治理（提案 → 投票 → 执行 → 取消） |
| `SimpleTarget.sol` | DAO 控制的目标合约示例 |

### 治理流程

1. 代币持有者 `delegate()` 激活投票权
2. 达到阈值者 `propose()` 创建提案
3. 投票期内 `vote()`（赞成/反对/弃权）
4. 投票通过后 `execute()` 执行
