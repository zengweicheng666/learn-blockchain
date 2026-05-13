# ERC20 代币合约

OpenZeppelin ERC20 代币合约，支持 mint（ownerOnly）和 burn。

## 环境

- Solidity: `0.8.28`
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

`contracts/MyToken.sol` — 标准 ERC20 + Ownable

- `mint(address to, uint256 amount)` — owner 铸造
- `burn(uint256 amount)` — 任意用户销毁自己的代币
