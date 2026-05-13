# DApp 前端脚手架

Phase 3 全栈 DApp 前端项目。基于 **Next.js + Wagmi + viem + RainbowKit** 的区块链前端工具链。

## 用途

展示 DApp 前端开发的核心技术栈：钱包连接、链上数据读取、智能合约交互。

## 环境

| 项目 | 版本 |
|------|------|
| Node.js | ^20 / ^23 |
| npm | ^10 |
| Next.js | 16.2.6 |
| React | 19.2.4 |
| TypeScript | ^5 |

## 依赖

| 包 | 版本 | 用途 |
|---|------|------|
| wagmi | ^2.19 | React Hooks 连接链上数据 |
| viem | ^2.48 | 类型安全的链上读写库 |
| @rainbow-me/rainbowkit | ^2.2 | 钱包连接 UI |
| @tanstack/react-query | ^5.100 | 异步状态管理 |
| tailwindcss | ^4 | 样式 |

## 快速开始

```bash
# 安装依赖
npm install

# 复制环境变量（可选，用于 WalletConnect）
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID | 否 | [WalletConnect Cloud](https://cloud.walletconnect.com) Project ID，不填则使用 MetaMask 内建注入 |

## 项目结构

```
src/
└── app/
    ├── layout.tsx      # 根布局 + Providers 注入
    ├── page.tsx        # 首页（钱包连接 + 链上数据展示）
    ├── providers.tsx   # Wagmi + RainbowKit + ReactQuery Provider 封装
    ├── wagmi.ts       # Wagmi 配置（网络 / 传输 / 连接器）
    └── globals.css    # 全局样式
```

## 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（localhost:3000） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 检查 |

## 学习路线

- [Wagmi 文档](https://wagmi.sh) — React Hooks 链上交互
- [viem 文档](https://viem.sh) — 底层链交互库
- [RainbowKit 文档](https://www.rainbowkit.com) — 钱包连接 UI
