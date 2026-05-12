# 阶段一复盘总结

日期：2026-05-12

## 总览

> 21 天，从零到部署智能合约，完成区块链核心知识体系的建立。

### 提交统计

```
总 commit 数: 23（不含初始化）
覆盖天数: 21 / 21 ✅
产出笔记: 14 篇
产出代码项目: 4 个（mini-blockchain / hash-demo / merkle-tree / first-contract）
```

---

## 三周回顾

### 第 1 周：区块 + 链 + 共识

| 天 | 主题 | 核心概念 |
|---|------|---------|
| 1 | 区块结构 | Block Header（Parent Hash, Nonce, Merkle Root, Timestamp） |
| 2 | 链式结构 | 哈希链、创世区块、最长链 |
| 3 | 哈希函数 | SHA256、雪崩效应、抗碰撞 |
| 4 | PoW | Nonce 搜索、难度调整 |
| 5 | 分叉 | 临时分叉、硬/软分叉、51% 攻击 |
| 6 | 迷你区块链 | TS 实现 Block + Blockchain + PoW + isValid |
| 7 | 复盘 | 知识点梳理 |

### 第 2 周：共识机制 + 密码学

| 天 | 主题 | 核心概念 |
|---|------|---------|
| 8 | PoS | 验证者、质押、RANDAO、LMD-GHOST、Casper-FFG |
| 9 | 共识机制对比 | DPoS、PBFT、CAP 定理、全景对比表 |
| 10 | 非对称加密 | ECC vs RSA、K = k * G、密钥对生成 |
| 11 | 数字签名 | ECDSA、签名/验签、ecrecover、以太坊地址推导 |
| 12 | 默克尔树 | Merkle Proof、防第二原像攻击、TS 实现 |
| 13 | 轻节点与全节点 | 节点类型对比、Merkle Proof 轻量验证 |
| 14 | 复盘 | 知识点梳理 |

### 第 3 周：以太坊 + 智能合约入门

| 天 | 主题 | 核心概念 |
|---|------|---------|
| 15 | 从比特币到以太坊 | 四大创新：智能合约/EVM/Gas/账户模型 |
| 16 | EVM | Stack/Memory/Storage、Opcode、Gas |
| 17 | Gas 与账户模型 | EIP-1559、Base Fee 销毁、EOA vs 合约账户 |
| 18 | 交易生命周期 | 7 阶段流程、ABI 编码、Mempool |
| 19 | 第一个合约 | Counter：状态变量/函数/事件 |
| 20 | 合约事件 | Event 日志机制、indexed 过滤、Event vs Storage |
| 21 | 阶段复盘 | 整体回顾 |

---

## 产出交付物

### 代码项目

| 项目 | 路径 | 说明 |
|------|------|------|
| 迷你区块链 | `projects/mini-blockchain/` | Block + Blockchain + PoW + isValid |
| 哈希演示 + PoW 模拟 | `projects/hash-demo/` | SHA256 雪崩效应 + 挖矿模拟 + ECDSA 签名 |
| 默克尔树 | `projects/merkle-tree/` | MerkleTree 完整实现 + 9 测试 + 轻节点验证 |
| 计数器合约 | `projects/first-contract/` | Counter.sol + 事件升级版 |
| ERC20 代币 | `projects/erc20-token/` | Hardhat 项目 + 8 测试（阶段二待续） |

### 笔记（17 篇）

```
notes/
├── day1-block-structure.md
├── day2-chain-structure.md
├── day3-hash.md
├── day4-pow.md
├── day5-forks.md
├── day8-pos.md
├── day9-consensus-comparison.md
├── day10-asymmetric-crypto.md
├── day11-digital-signature.md
├── day12-merkle-tree.md
├── day13-light-node.md
├── day15-bitcoin-to-ethereum.md
├── day16-evm.md
├── day17-gas-account.md
├── day18-transaction-lifecycle.md
├── day19-first-contract.md
├── day20-events.md
├── week1-review.md
├── week2-review.md
└── week3-review.md（本文）
```

---

## 核心概念掌握度自评

| 概念 | 掌握度 | 备注 |
|------|--------|------|
| 区块结构 | ★★★★☆ | Parent Hash 修正后已牢固 |
| 哈希链 | ★★★★★ | 实操追溯 + 代码验证 |
| PoW | ★★★★☆ | 模拟器跑通，理解难度调整 |
| 分叉与最长链 | ★★★★★ | 三种分叉 + 51% 攻击边界清晰 |
| PoS | ★★★★☆ | 三个核心算法（RANDAO/LMD-GHOST/Casper-FFG） |
| 共识机制对比 | ★★★★☆ | 全景对比表：PoW/PoS/DPoS/PBFT |
| 非对称加密 | ★★★★★ | ECC vs RSA 数据对比 + 密钥生成实操 |
| 数字签名 | ★★★★★ | 签名/验签/篡改检测/地址推导 |
| 默克尔树 | ★★★★★ | 完整 TS 实现 + 9 测试 + 轻节点验证 |
| 轻节点 | ★★★★☆ | 概念清晰，Merkle Proof 验证跑通 |
| EVM | ★★★★☆ | Stack/Memory/Storage + Opcode + Gas |
| Gas + EIP-1559 | ★★★★☆ | Base Fee 销毁 + Priority Fee |
| 交易生命周期 | ★★★★☆ | 7 阶段全流程理解 |
| Solidity 基础 | ★★★☆☆ | Counter 合约 + Event 机制，需更多实践 |

---

## 阶段一检查清单

- [x] 能用自己的话讲清楚区块链的工作原理
- [x] 手上有一个跑通的 TypeScript 迷你区块链
- [x] 默克尔树代码已实现 + 测试通过
- [x] 理解数字签名如何证明所有权
- [x] 理解 Gas 机制和 EIP-1559
- [x] 能在 Remix 中编写和部署合约
- [x] 至少有 3 篇技术笔记在 GitHub 上

---

## 进入阶段二

阶段一完成了区块链的理论基础和工具链搭建。阶段二将深入 Solidity 智能合约开发：

```
第 4 周: ERC20 代币（深入 OpenZeppelin + 部署到 Sepolia）
第 5 周: NFT 铸造合约（ERC721）
第 6 周: 拍卖合约
第 7 周: 简易 AMM 去中心化交易所
第 8 周: DAO 投票合约
```

准备好了随时进入阶段二。
