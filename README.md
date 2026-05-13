# Blockchain Learning

24 周区块链工程师学习路线的完整记录与代码实践。从零构建区块链认知体系，覆盖核心概念、密码学、智能合约到 DApp 全栈开发。

## 阶段一：区块链核心概念（第 1-3 周）✅

| 周次 | 主题 | 内容 |
|------|------|------|
| 第 1 周 | 区块 + 链 + 共识 | 区块结构、哈希链、PoW、分叉、迷你区块链 |
| 第 2 周 | 共识机制 + 密码学 | PoS、DPoS、PBFT、CAP、ECC、数字签名、默克尔树 |
| 第 3 周 | 以太坊 + 智能合约 | EVM、Gas、EIP-1559、交易生命周期、Counter 合约、Event |

## 阶段二：Solidity 深度开发（第 4-8 周）✅

| 周次 | 主题 | 项目 |
|------|------|------|
| 第 4 周 | ERC20 + NFT | 代币合约 + ERC721 白名单铸造 |
| 第 5 周 | 拍卖合约 | 英式拍卖 + Pull over Push |
| 第 6 周 | AMM | 恒定乘积做市商 x\*y=k |
| 第 7 周 | DAO | 投票治理合约 |
| 第 8 周 | 协议精读 + 安全 | 合约审计清单、Ethernaut CTF |

## 阶段三：全栈 DApp 开发（第 9-16 周）✅

| 周次 | 主题 | 项目 |
|------|------|------|
| 第 9 周 | 前端工具链 | Wagmi + viem + RainbowKit 脚手架 |
| 第 10 周 | DApp 核心交互 | 交易流程 / 事件监听 / The Graph |
| 第 11-12 周 | 实战项目一 | 流动性质押协议（存款/赎回/收益展示） |
| 第 13-16 周 | 实战项目二 | NFT 市场（上架/报价/版税/拍卖） |

## 阶段四：求职冲刺（第 17-24 周）📅

| 周次 | 主题 | 目标 |
|------|------|------|
| 第 17-18 周 | 面试知识点梳理 | 区块链基础 + Solidity 安全题库 |
| 第 19-20 周 | 简历与作品集打磨 | 作品集页面 + 技术博客 |
| 第 21-24 周 | 投递与面试实战 | 20+ 岗位投递 + 模拟面试 |

## 项目结构

```
learnspace/
├── projects/                 # 代码项目
│   │── mini-blockchain/      # TS 迷你区块链（Block + PoW + 验证）
│   │── hash-demo/            # SHA256 雪崩效应、PoW 模拟、ECDSA 签名
│   │── merkle-tree/          # 默克尔树 TS 实现 + 轻节点验证
│   │── first-contract/       # Solidity Counter 合约
│   │── erc20-token/          # Hardhat ERC20 代币项目
│   │── nft-contract/         # ERC721 NFT 铸造（白名单 + 公开销售）
│   │── auction-contract/     # 英式拍卖（Pull over Push）
│   │── amm-contract/         # 恒定乘积 AMM
│   │── dao-contract/         # DAO 投票治理
│   │── liquid-staking/       # 流动性质押（合约 + 测试 + DApp）
│   │── nft-marketplace/      # NFT 市场（上架/版税/拍卖/PlatformFee）
│   └── dapp/                 # 前端脚手架（Next.js + Wagmi + RainbowKit）
├── notes/                    # 每日学习笔记
│   ├── phase1/               # 阶段一（第 1-3 周核心概念）
│   ├── phase2/               # 阶段二（第 4-8 周 Solidity 项目）
│   └── phase3/               # 阶段三（第 9-16 周全栈 DApp）
├── references/               # 参考资料
└── docs/                     # 学习路线规划与设计文档
    └── superpowers/
        ├── specs/            # 路线设计文档
        └── plans/            # 分阶段执行计划
```

## 课程规划

完整 24 周学习路线设计：[docs/superpowers/specs/](./docs/superpowers/specs/)

## License

MIT
