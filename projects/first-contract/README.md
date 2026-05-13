# Counter 合约

第一个 Solidity 智能合约，学习合约基础结构。

## 环境

- Solidity: `^0.8.28`
- 开发工具: Remix IDE / Hardhat

## 合约

`Counter.sol`

```
声明周期事件：
Counter deployed → increment() 递增计数器 → getCount() 读取当前值
```

## 核心概念

- `uint256` 状态变量
- `public` 可见性
- `increment()` 修改状态（需要 Gas）
- `getCount()` 读取状态（免费，view 函数）
- `event` 日志记录
