# Week 9：前端工具链（Wagmi + viem + RainbowKit）

## 学习目标
- 理解 DApp 前端架构：Wallet → RPC → Contract
- 掌握 Wagmi React Hooks 链上交互
- 掌握 viem 类型安全的链上读写
- 配置 RainbowKit 钱包连接 UI

## 项目结构

```
projects/dapp/
├── src/app/
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页（钱包连接 + 链上数据）
│   ├── providers.tsx     # Wagmi + RainbowKit Provider 封装
│   ├── wagmi.ts         # Wagmi 配置（链 / 传输 / 连接器）
│   └── globals.css       # Tailwind 样式
├── .env.example          # 环境变量模板
├── next.config.ts        # Next.js 配置
└── package.json          # 依赖
```

## 核心知识点

### Wagmi（React Hooks 层）

Wagmi 是对 viem 的 React Hooks 封装，核心 Hooks：

| Hook | 用途 |
|------|------|
| `useAccount` | 获取当前连接账户（address / isConnected） |
| `useBalance` | 查询地址余额 |
| `useBlockNumber` | 当前区块号（支持 watch 轮询） |
| `useReadContract` | 读取合约数据（view/pure 函数） |
| `useWriteContract` | 写入合约数据（交易） |
| `useWatchContractEvent` | 实时监听合约事件 |

### viem（底层链交互层）

| 功能 | 说明 |
|------|------|
| `createPublicClient` | 创建公共客户端（只读） |
| `createWalletClient` | 创建钱包客户端（签名 + 交易） |
| `http()` | HTTP 传输（连接 RPC） |
| `getContract` | 类型安全的合约实例 |

### RainbowKit（钱包连接 UI）

- `ConnectButton`：开箱即用的钱包连接按钮
- `RainbowKitProvider`：主题 / 语言 / 链切换
- 支持 MetaMask / WalletConnect / Coinbase Wallet

## 工具链架构

```
┌──────────────────────────────┐
│  React / Next.js             │
│  ┌─────────┐ ┌────────────┐  │
│  │ Wagmi   │ │ RainbowKit │  │
│  │ (Hooks) │ │ (UI)       │  │
│  └────┬────┘ └────────────┘  │
│       │                      │
│  ┌────▼────┐                 │
│  │ viem    │                 │
│  │ (读写)  │                 │
│  └────┬────┘                 │
├───────┼──────────────────────┤
│  ┌────▼────┐                 │
│  │ RPC     │ ←── MetaMask    │
│  │ (Node)  │     WalletConn  │
│  └─────────┘                 │
└──────────────────────────────┘
```

## 关键配置

### Wagmi Config（wagmi.ts）

```typescript
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
```

### Provider 层级（providers.tsx）

```typescript
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      {children}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

## 注意事项

### wagmi 版本兼容性
- RainbowKit 2.2.x 依赖 wagmi ^2.x（不支持 wagmi v3）
- wagmi v3 使用不同的包结构和 peer deps
- 当前推荐：wagmi ^2.19 + RainbowKit ^2.2 + viem ^2.x

### WalletConnect Project ID
- RainbowKit 的 `getDefaultConfig()` 强制要求 WalletConnect Cloud Project ID
- 替代方案：直接使用 wagmi `createConfig()` + `injected()` connector
- 优点：无需注册即可使用 MetaMask
- 限制：不支持 WalletConnect 协议的钱包

### SSR 兼容
- Wagmi + RainbowKit 需要 Client Component（`"use client"`）
- `ssr: true` 配置避免 hydration 不匹配
- RainbowKit 样式需要全局导入 `@rainbow-me/rainbowkit/styles.css`

## 测试命令

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 验证构建成功
npm run start
```

## 学习资源
- [Wagmi 文档](https://wagmi.sh)
- [viem 文档](https://viem.sh)
- [RainbowKit 文档](https://www.rainbowkit.com)
