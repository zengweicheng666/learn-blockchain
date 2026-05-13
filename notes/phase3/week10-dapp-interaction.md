# Week 10：DApp 核心交互

## 学习目标
- 掌握交易流程管理：发送 → 确认 → 回执 → 错误处理
- 学会实时监听合约事件驱动前端更新
- 了解 The Graph 索引方案

## 项目结构

```
projects/dapp/src/
├── app/
│   ├── layout.tsx          # 根布局 + 导航
│   ├── nav.tsx             # 导航栏（路由切换 + 钱包连接）
│   ├── page.tsx            # 首页（链上数据概览）
│   ├── dao/
│   │   └── page.tsx        # DAO 治理交互页
│   ├── providers.tsx       # Provider 层级封装
│   └── wagmi.ts           # Wagmi 配置（Hardhat + Sepolia）
└── lib/
    └── contracts.ts        # 合约 ABI + 地址
```

## 核心知识点

### 1. 交易流程管理

用 Wagmi `useWriteContract` 管理交易生命周期：

```
用户点击 → wallet 弹签名 → 已签名(pending)
                                ↓
                         等待区块确认(confirming)
                                ↓
                         交易确认(confirmed)
                                ↓
                         成功 or 回滚(error)
```

关键代码模式：

```tsx
const { writeContractAsync } = useWriteContract();

const handleSubmit = async () => {
  setTxStatus("pending");           // 等待签名
  try {
    const hash = await writeContractAsync({
      address: DAO_ADDRESS,
      abi: DAO_ABI,
      functionName: "propose",
      args: [target, value, data, description],
    });
    setTxHash(hash);
    setTxStatus("confirmed");        // 交易确认
  } catch {
    setTxStatus("error");            // 失败处理
  }
};
```

### 2. 链上数据读取

```tsx
// 读取合约状态（view 函数）
const { data: count } = useReadContract({
  address: DAO_ADDRESS,
  abi: DAO_ABI,
  functionName: "proposalCount",
});

// 读取提案详情
const { data: proposal } = useReadContract({
  address: DAO_ADDRESS,
  abi: DAO_ABI,
  functionName: "proposals",
  args: [BigInt(proposalId)],
});
```

### 3. 事件监听

用 Wagmi `useWatchContractEvent` 实时监听：

```tsx
useWatchContractEvent({
  address: DAO_ADDRESS,
  abi: DAO_ABI,
  eventName: "ProposalCreated",
  onLogs(logs) {
    // 新提案事件 → 更新 UI
    setEvents(prev => [
      { id: Number(log.args.proposalId), description: log.args.description },
      ...prev,
    ]);
  },
});
```

### 4. 本地开发网络

| 网络 | RPC URL | Chain ID |
|------|---------|----------|
| Hardhat Local | http://127.0.0.1:8545 | 31337 |
| Sepolia | https://ethereum-sepolia.publicnode.com | 11155111 |

Hardhat 节点提供 20 个预充值账户（各 10000 ETH），适合本地开发测试。

## 技术要点

### 交易进度 UI 设计

- **pending**：钱包签名中，显示 loading 动画
- **confirming**：交易已广播，等待区块确认
- **confirmed**：交易已上链，显示 tx hash
- **error**：用户拒绝 / Gas 不足 / 合约回滚

### 多网络支持

```tsx
// wagmi.ts - 同时配置开发和生产网络
export const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http(),   // 本地开发
    [sepolia.id]: http(),   // 测试网
  },
});
```

### viem defineChain

自定义链用 `defineChain`：

```tsx
import { defineChain } from "viem";

export const hardhat = defineChain({
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  testnet: true,
});
```

## The Graph（概念介绍）

The Graph 是一个链上数据索引协议：

| 问题 | 解决方案 |
|------|---------|
| RPC 查询慢，不适合复杂过滤 | Subgraph 用 GraphQL 高效查询 |
| 事件数据难以聚合 | 自动索引合约事件 |
| 多合约数据关联复杂 | 统一的 Schema 定义 |

Subgraph 核心文件：

```
subgraph.yaml    # 配置文件（合约地址、事件、区块范围）
schema.graphql   # 数据模型定义
src/mapping.ts   # 事件处理逻辑（AssemblyScript）
```

## 测试命令

```bash
# 1. 启动本地 Hardhat 节点
cd projects/dao-contract
npx hardhat node

# 2. 另一个终端部署合约
npx hardhat run scripts/deploy.js --network localhost

# 3. 启动 DApp 前端
cd projects/dapp
npm run dev

# 4. 浏览器访问
open http://localhost:3000
```

## 学习资源
- [Wagmi useWriteContract](https://wagmi.sh/react/api/hooks/useWriteContract)
- [Wagmi useWatchContractEvent](https://wagmi.sh/react/api/hooks/useWatchContractEvent)
- [viem 文档](https://viem.sh)
- [The Graph 文档](https://thegraph.com/docs)
