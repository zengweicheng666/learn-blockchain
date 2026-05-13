# Week 11-12：Liquid Staking 协议

## 学习目标
- 理解 Liquid Staking 原理：质押 ETH 换取生息代币 stETH
- 掌握 Shares 模型：汇率 = totalEthStaked / totalSupply
- 构建完整的质押 DApp：合约 + 前端交互

## 合约设计：LiquidStaking.sol

### Shares 模型

```
用户存入 ETH → 按当前汇率计算 stETH 数量 → 铸造 stETH
用户赎回 stETH → 按当前汇率计算 ETH 数量 → 销毁 stETH → 转出 ETH
```

汇率计算：

```
当 totalSupply == 0: 汇率 = 1（1 ETH = 1 stETH）
当 totalSupply > 0: 汇率 = totalEthStaked / totalSupply

举例：
  初始: Alice 存入 100 ETH → 100 stETH（汇率 1:1）
  一年后收益 5%: totalEthStaked = 105 ETH, 汇率 = 1.05
  Bob 存入 10 ETH → 9.52 stETH（汇率 > 1）
  Alice 赎回 100 stETH → 105 ETH（享受收益）
```

### 收益机制

```solidity
uint256 yieldAmount = (totalEthStaked * apr * timeElapsed) / (10000 * 365 days);
totalEthStaked += yieldAmount; // 汇率上涨，stETH 持有者自动受益
```

- APR 以基点为单位（500 bps = 5%）
- 收益是虚拟的：`totalEthStaked` 增加但无实际 ETH 存入
- 在真实协议中（如 Lido），收益来自共识层验证者奖励
- 提取收益前需要向合约注入额外 ETH

### 关键代码

```solidity
function stake() public payable {
    uint256 shares;
    if (totalSupply() == 0) {
        shares = msg.value;  // 首次存入 1:1
    } else {
        shares = (msg.value * totalSupply()) / totalEthStaked;
    }
    _mint(msg.sender, shares);
    totalEthStaked += msg.value;
}
```

```solidity
function unstake(uint256 stEthAmount) external {
    uint256 ethAmount = (stEthAmount * totalEthStaked) / totalSupply();
    _burn(msg.sender, stEthAmount);
    totalEthStaked -= ethAmount;
    payable(msg.sender).transfer(ethAmount);
}
```

## Staking DApp 前端

### 页面结构 `stake/page.tsx`

| 组件 | 功能 | Wagmi Hook |
|------|------|-----------|
| StakingDashboard | TVL / APR / 汇率 / 用户 stETH | `useReadContract` |
| StakeForm | 存入 ETH → 铸造 stETH | `useWriteContract` + `value` |
| UnstakeForm | 销毁 stETH → 提取 ETH | `useWriteContract` |
| AccrueYieldButton | 手动触发收益 | `useWriteContract` |
| EventFeed | 实时监听 YieldAccrued 事件 | `useWatchContractEvent` |

### 交易流程

```tsx
// stake() 需要传 value（msg.value）
const hash = await writeContractAsync({
  address: STAKING_ADDRESS,
  abi: STAKING_ABI,
  functionName: "stake",
  value: parseEther(amount),  // ⚠️ payable 函数需要 value
});

// unstake() 传 args
const hash = await writeContractAsync({
  address: STAKING_ADDRESS,
  abi: STAKING_ABI,
  functionName: "unstake",
  args: [parseEther(amount)],
});
```

### 路由

DApp 现在有三个页面：

| 路由 | 功能 |
|------|------|
| `/` | 首页（钱包 + 余额 + 区块） |
| `/dao` | DAO 治理交互 |
| `/stake` | Liquid Staking 质押 |

## 测试要点

- `totalSupply` 初始为 0 时，汇率返回 1e18
- 首次存入 1:1，后续按汇率计算
- 收益公式考虑时间差（按秒计算）
- 提取收益需要在合约中有足够 ETH 余额
- `receive()` 会调用 `stake()`，直接转账也能质押

## 技术要点

- **OpenZeppelin v5.6.1 mcopy**: 需要 `evmVersion: "cancun"`（Hardhat 配置）
- **Wagmi v2.x**: `useWriteContract` 的 `writeContractAsync` 用于异步交易
- **TypeScript 类型窄化**: `log.args.yieldAmount` 可能为 `undefined`，需提前提取变量

## 测试命令

```bash
# 编译
cd projects/liquid-staking
npx hardhat compile

# 运行测试（需要 Hardhat 节点）
npx hardhat test

# 部署到本地节点
npx hardhat run scripts/deploy.js --network localhost

# 启动 DApp
cd projects/dapp
npm run dev
```

## 学习资源
- [Liquid Staking 概述](https://ethereum.org/en/staking/liquid-staking/)
- [Lido 白皮书](https://docs.lido.fi/)
- [Wagmi useWriteContract](https://wagmi.sh/react/api/hooks/useWriteContract)
- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/5.x/erc20)
