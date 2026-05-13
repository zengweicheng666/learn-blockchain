# Liquid Staking 协议

流动性质押合约 + DApp 前端。用户质押 ETH 获得生息代币 stETH，汇率随时间增长。

## 环境

| 项目 | 版本 |
|------|------|
| Node.js | ^20 / ^23 |
| npm | ^10 |
| Hardhat | ^2.28 |
| Solidity | ^0.8.28 |
| OpenZeppelin | ^5.6.1 |

## 合约

`contracts/LiquidStaking.sol` — ERC20 代币 + Staking 逻辑：

| 函数 | 说明 |
|------|------|
| `stake()` | 存入 ETH 铸造 stETH（payable） |
| `unstake(stEthAmount)` | 销毁 stETH 提取 ETH |
| `accrueYield()` | 按 APR 和时间累积收益 |
| `getExchangeRate()` | 查看当前汇率 |
| `setApr(_apr)` | 仅 Owner 更新 APR（基点） |

### Shares 模型

```
初始阶段:          1 ETH = 1 stETH
收益累积后:         1 stETH > 1 ETH（汇率 > 1）
新用户存入:         按更高汇率计算 stETH
```

## 测试

```bash
npx hardhat test
```

覆盖场景：质押/赎回/收益累积/汇率变化/权限控制/边界情况，共 24 个测试。

## 部署

```bash
# 启动 Hardhat 节点
npx hardhat node

# 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

## DApp 前端

质押交互页面位于 `projects/dapp/src/app/stake/page.tsx`，包含：

| 功能 | 组件 |
|------|------|
| 仪表盘 | TVL / APR / 汇率 / 用户 stETH |
| 质押表单 | 存入 ETH → 铸造 stETH |
| 赎回表单 | 销毁 stETH → 提取 ETH |
| 收益触发 | 手动调用 accrueYield |
| 事件监听 | 实时显示 YieldAccrued 事件 |

启动 DApp：

```bash
cd projects/dapp
npm run dev
```
