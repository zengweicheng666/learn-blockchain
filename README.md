# Blockchain Learning

24 周区块链工程师学习路线的完整记录与代码实践。从零构建区块链认知体系，覆盖核心概念、密码学、智能合约到 DApp 全栈开发。

## 阶段一：区块链核心概念（第 1-3 周）✅

| 周次 | 主题 | 内容 |
|------|------|------|
| 第 1 周 | 区块 + 链 + 共识 | 区块结构、哈希链、PoW、分叉、迷你区块链 |
| 第 2 周 | 共识机制 + 密码学 | PoS、DPoS、PBFT、CAP、ECC、数字签名、默克尔树 |
| 第 3 周 | 以太坊 + 智能合约 | EVM、Gas、EIP-1559、交易生命周期、Counter 合约、Event |

## 阶段二：Solidity 深度开发（第 4-7 周）✅

| 周次 | 主题 | 项目 |
|------|------|------|
| 第 4 周 | NFT 铸造 | ERC721 白名单 + 公开销售 |
| 第 5 周 | 拍卖合约 | 英式拍卖 + Pull over Push |
| 第 6 周 | AMM | 恒定乘积做市商 x*y=k |
| 第 7 周 | DAO | 投票治理合约 |

## 阶段三：全栈 DApp 开发（第 9-16 周）🚧

| 周次 | 主题 | 项目 |
|------|------|------|
| 第 9 周 | 前端工具链 | Wagmi + viem + RainbowKit 脚手架 ✅ |
| 第 10 周 | DApp 核心交互 | 交易流程 / 事件监听 / The Graph |
| 第 11-12 周 | 实战项目一 | 流动性质押协议 ✅ |
| 第 13-16 周 | 实战项目二 | NFT 市场 / 期权协议 / 任务平台 |

## 项目结构

```
learnspace/
├── projects/                 # 代码项目（每个都有 README）
│   ├── mini-blockchain/      # TypeScript 迷你区块链（Block + PoW + 验证）
│   ├── hash-demo/            # SHA256 雪崩效应、PoW 模拟、ECDSA 签名
│   ├── merkle-tree/          # 默克尔树 TS 实现 + 轻节点验证演示
│   ├── first-contract/       # Solidity Counter 合约
│   ├── erc20-token/          # Hardhat ERC20 代币项目
│   ├── nft-contract/         # ERC721 NFT 铸造合约（白名单 + 公开销售）
│   ├── auction-contract/     # 英式拍卖合约（Pull over Push）
│   ├── amm-contract/         # 恒定乘积 AMM 去中心化交易所
│   ├── dao-contract/         # DAO 投票治理合约
│   ├── liquid-staking/       # 流动性质押协议（合约 + 测试 + DApp 交互页）
│   └── dapp/                 # DApp 前端脚手架（Next.js + Wagmi + RainbowKit）
├── notes/                    # 每日学习笔记
│   ├── phase2/               # 阶段二笔记（NFT / 拍卖 / AMM / DAO）
│   ├── phase3/               # 阶段三笔记（Week 9-16）
│   ├── day1-block-structure.md
│   ├── day2-chain-structure.md
│   ├── day3-hash.md
│   ├── day4-pow.md
│   ├── day5-forks.md
│   ├── day8-pos.md
│   ├── day9-consensus-comparison.md
│   ├── day10-asymmetric-crypto.md
│   ├── day11-digital-signature.md
│   ├── day12-merkle-tree.md
│   ├── day13-light-node.md
│   ├── day15-bitcoin-to-ethereum.md
│   ├── day16-evm.md
│   ├── day17-gas-account.md
│   ├── day18-transaction-lifecycle.md
│   ├── day19-first-contract.md
│   └── day20-events.md
├── references/               # 参考资料
└── docs/                     # 规划文档
```

## 课程规划

完整 24 周学习路线设计：[docs/superpowers/specs/](./docs/superpowers/specs/)

## License

MIT
