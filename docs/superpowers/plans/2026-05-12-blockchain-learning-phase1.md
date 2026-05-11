# 区块链学习计划 · 阶段一：核心概念（第 1-3 周）

> **说明：** 本阶段适合按天执行，每天预计 6-8 小时。每周末有交付物和复盘。学习材料主要引用以太坊官方文档、Bitcoin whitepaper 以及经典技术博客。

**目标：** 三周后能用 TypeScript 实现迷你区块链 + 默克尔树，并在测试网部署第一个合约

**前置条件：** 有 TypeScript/JavaScript 编程基础

---

## 第一周：区块 + 链 + 共识

### 第 1 天：区块结构

- [ ] **学习：什么是区块？**
  - 读：Bitcoin Whitepaper 第 2-3 节（约 10 分钟，懂大意即可）
  - 看：区块链浏览器（etherscan.io）浏览一个真实区块，找到区块高度、时间戳、交易数、Gas Used
  - 理解概念：区块头（Prev Hash、Timestamp、Nonce、Merkle Root）、区块体（交易列表）
- [ ] **实践：写笔记**
  - 用你自己的话画出区块结构图（文字 + 箭头即可）
  - 保存到 `learnspace/notes/day1-block-structure.md`
- [ ] **产出：** 一篇区块结构笔记 + 截取 etherscan 上某个区块的截图保存

### 第 2 天：交易与链式结构

- [ ] **学习：交易如何组成链？**
  - 读：每个区块的父哈希指向前一个区块 → 形成链
  - 理解：创世区块、区块高度、最长链
  - 实操：在 etherscan 上从一个随机区块往回追 3 个区块，确认哈希链条
- [ ] **阅读：** 《How does Ethereum work, anyway?》 - Preethi Kasireddy（经典入门长文，通读）
- [ ] **产出：** `notes/day2-chain-structure.md`，用文字描述"从创世区块到最新区块的链条形成过程"

### 第 3 天：哈希函数

- [ ] **学习：SHA256 哈希**
  - 理解：哈希函数的四个性质（确定性、快速计算、雪崩效应、抗碰撞）
  - 演示：在 Node.js 中运行 `crypto.createHash('sha256').update('hello').digest('hex')`，改一个字符看看结果
- [ ] **实践：** 写一个 TypeScript 脚本，比较两个相似输入（"hello" vs "hellp"）的哈希差异，输出位数不同的比例
- [ ] **产出：** `notes/day3-hash.md` + 哈希差异比较脚本

### 第 4 天：工作量证明（PoW）

- [ ] **学习：PoW 原理**
  - 理解：矿工通过计算 Nonce 使区块哈希满足目标难度
  - 理解：难度调整、出块时间（比特币 10 分钟，以太坊 ~12 秒）
  - 对比：PoW 的优缺点（安全性 vs 能源消耗）
- [ ] **实践：** 写一个简单 PoW 模拟（TypeScript）：循环递增 Nonce，直到 SHA256 哈希以 4 个零开头
- [ ] **产出：** `notes/day4-pow.md` + PoW 模拟脚本

### 第 5 天：最长链原则与分叉

- [ ] **学习：区块链如何解决冲突？**
  - 理解：临时分叉（叔块/Uncle Block）、最长链是权威链
  - 理解：51% 攻击的场景——如果掌控了大部分算力会发生什么
  - 读：以太坊叔块机制（GHOST 协议）
- [ ] **产出：** `notes/day5-forks.md`，用自己的话解释为什么 6 个确认后交易基本不可逆

### 第 6 天：综合实践 —— 写迷你区块链

- [ ] **动手：用 TypeScript 实现一个迷你区块链**
  - 实现 `Block` 接口：包含 index, timestamp, data, prevHash, hash, nonce
  - 实现 `Blockchain` 类：`addBlock(data)` 方法，自动链接哈希 + 简单 PoW
  - 实现 `isChainValid()` 验证方法
- [ ] **测试：** 创建 3-5 个区块，篡改其中一个，验证 `isChainValid()` 返回 false
- [ ] **产出：** `projects/mini-blockchain/` 目录，包含完整代码 + README

### 第 7 天：复盘 + 输出

- [ ] **整理笔记：** 把本周的 5 篇笔记整理润色
- [ ] **发布：** 将一篇笔记（如"区块链到底是怎么链接起来的？"）发布到你的博客或 GitHub Discussions
- [ ] **提交代码：** 迷你区块链项目推送到 GitHub
- [ ] **复盘检查：**
  - [ ] 能用大白话解释区块里有什么
  - [ ] 手上有一个跑得通的迷你区块链
  - [ ] 理解了 PoW 为什么能防止篡改

---

## 第二周：共识机制 + 密码学基础

### 第 8 天：PoS 共识机制

- [ ] **学习：PoS 原理**
  - 理解：验证者（Validator）质押 ETH → 被选中提议区块 → 其他验证者证明
  - 对比：PoW vs PoS：安全性假设、能耗、进入门槛、最终性
  - 读：以太坊 PoS 机制概述（ethereum.org 中文版）
- [ ] **实践：** 写一篇对比笔记，重点分析为什么以太坊要从 PoW 转 PoS
- [ ] **产出：** `notes/day8-pos.md`

### 第 9 天：其他共识机制

- [ ] **学习：DPoS / PBFT / 拜占庭容错**
  - DPoS：EOS 为代表，持币人投票选见证人（超级节点）
  - PBFT：Hyperledger Fabric 为代表，联盟链常用，最终性强
  - 理解：CAP 定理在区块链中的体现——一致性、可用性、分区容忍性
- [ ] **产出：** `notes/day9-consensus-comparison.md`，画一张共识机制对比表格

### 第 10 天：非对称加密（上）

- [ ] **学习：公私钥密码学**
  - 理解：对称加密 vs 非对称加密
  - 理解：ECC（椭圆曲线加密）为什么比 RSA 更高效
  - 实操：用 Node.js 的 `crypto.generateKeyPairSync('ec', ...)` 生成一对 ECDSA 密钥
- [ ] **产出：** `notes/day10-asymmetric-crypto.md` + 密钥生成脚本

### 第 11 天：非对称加密（下）—— 数字签名

- [ ] **学习：签名与验签流程**
  - 理解：私钥签名 = 证明拥有权，公钥验签 = 任何人可验证
  - 实操：用 TypeScript 对一段消息签名，然后验证签名的有效性。篡改消息内容后验证应失败
  - 理解：以太坊地址是从公钥哈希推导而来
- [ ] **产出：** `notes/day11-digital-signature.md` + 签名/验签脚本

### 第 12 天：默克尔树（Merkle Tree）

- [ ] **学习：默克尔树结构与作用**
  - 理解：叶子节点是交易哈希，父节点是子节点哈希拼接后取哈希
  - 理解：Merkle Proof —— 轻节点在不下载全部交易的情况下验证一笔交易存在
- [ ] **实践：** 用 TypeScript 实现默克尔树：
  - `buildTree(transactions)` 构建树
  - `getProof(transaction)` 生成某一笔交易的 Merkle Proof
  - `verifyProof(proof, root, transaction)` 验证证明
- [ ] **产出：** `projects/merkle-tree/` 目录，包含完整实现 + 测试

### 第 13 天：轻节点与全节点

- [ ] **学习：节点类型**
  - 全节点：下载全部区块和交易，验证一切
  - 轻节点：只下载区块头，通过 Merkle Proof 验证交易
  - 归档节点：存储全部历史状态
- [ ] **实践：** 将第 12 天的默克尔树验证与第 6 天的迷你区块链结合：轻量验证模式
- [ ] **产出：** `notes/day13-light-node.md`

### 第 14 天：复盘 + 输出

- [ ] **整理笔记：** 本周 6 篇笔记润色
- [ ] **发布：** 第二篇技术文章（如"默克尔树让轻节点成为可能"）
- [ ] **提交代码：** 默克尔树项目推送到 GitHub
- [ ] **复盘检查：**
  - [ ] 能说清 PoW 和 PoS 的核心区别
  - [ ] 理解数字签名如何证明所有权
  - [ ] 默克尔树实现已跑通所有测试

---

## 第三周：以太坊 + 智能合约入门

### 第 15 天：从比特币到以太坊

- [ ] **学习：以太坊的诞生**
  - 理解：比特币是"去中心化账本"，以太坊是"去中心化世界计算机"
  - 核心创新：图灵完备的智能合约、EVM、账户模型、Gas
  - 读：以太坊白皮书前 3 节（理解设计动机）
- [ ] **产出：** `notes/day15-bitcoin-to-ethereum.md`

### 第 16 天：以太坊虚拟机（EVM）

- [ ] **学习：EVM 如何工作？**
  - 理解：EVM 是一个准图灵完备的状态机
  - 理解：Opcode、字节码、Gas 消耗
  - 理解：EVM 的沙箱隔离——每个合约有独立存储空间
  - 演示：用 evm.codes playground 可视化执行简单 opcode
- [ ] **产出：** `notes/day16-evm.md`

### 第 17 天：Gas 与 Account 模型

- [ ] **学习：Gas 机制**
  - 理解：Gas = 计算单位，Gas Price = 你愿意为单位出的价，Gas Limit = 你愿意付的上限
  - 理解：EIP-1559 改革：Base Fee（燃烧）+ Priority Fee（给矿工/验证者小费）
  - 理解：两种账户类型：EOA（外部账户）+ 合约账户
- [ ] **产出：** `notes/day17-gas-account.md`

### 第 18 天：交易生命周期

- [ ] **学习：一笔交易从发起到确认的全过程**
  - 步骤：创建交易 → ABI 编码函数调用 → ECDSA 签名 → RLP 编码 → 广播到交易池 → 矿工/验证者打包 → 执行 → 状态根更新 → 入块
  - 实操：在以太坊 Sepolia 测试网上用 MetaMask 发一笔 0 ETH 交易，跟踪它在 etherscan 上的状态变化
- [ ] **产出：** `notes/day18-transaction-lifecycle.md` 含交易哈希截图

### 第 19 天：第一个 Solidity 合约

- [ ] **学习：Remix IDE + Solidity 基础**
  - 打开 remix.ethereum.org
  - 写第一个合约：一个简单的计数器（Counter），包含 `count` 变量、`increment()` 和 `decrement()` 函数
  - 编译合约，在 Remix 虚拟机中部署和测试
- [ ] **部署到 Sepolia 测试网：**
  - 安装 MetaMask，切换到 Sepolia 测试网
  - 从 faucet 领取测试 ETH（推荐 sepoliafaucet.com 或 alchemy.com/faucet）
  - 用 Remix 的 Injected Provider 环境连接 MetaMask，部署合约
  - 在 etherscan 上查看已部署的合约
- [ ] **产出：** `projects/first-contract/`，包含计数器合约源码 + 部署地址截图

### 第 20 天：合约交互与事件

- [ ] **学习：合约事件（Event）**
  - 理解：Event 是以太坊的日志机制，合约"发出"事件，链下应用"监听"事件
  - 改造计数器合约：每次 `increment()` 发出 `Incremented(address indexed who, uint newCount)` 事件
  - 重新部署，在 Remix 日志中查看事件输出
- [ ] **实践：** 在 etherscan 上找到你的合约，在"Events"选项卡下查看事件日志
- [ ] **产出：** `notes/day20-events.md`

### 第 21 天：阶段复盘 + 第一篇技术输出

- [ ] **整理三周来所有笔记**，选最好的 2 篇润色
- [ ] **发布技术文章：** 第三篇（如"我在测试网部署了人生第一个智能合约"），附带合约地址
- [ ] **提交代码：** 计数器合约项目推送到 GitHub
- [ ] **阶段复盘检查：**
  - [ ] 能用自己的话讲清楚区块链的工作原理（口头表述 3-5 分钟）
  - [ ] 手上有一个跑通的 TypeScript 迷你区块链 + 默克尔树代码
  - [ ] 已经在测试网上部署过合约，知道怎么发交易
  - [ ] 至少有 3 篇技术笔记在 GitHub 上

---

## 交付物汇总检查清单

### GitHub 仓库
- [ ] `projects/mini-blockchain/` — TypeScript 迷你区块链
- [ ] `projects/merkle-tree/` — TypeScript 默克尔树
- [ ] `projects/first-contract/` — 计数器合约 + 部署地址

### 笔记（`notes/` 目录）
- [ ] 第 1-7 天：区块结构、链、哈希、PoW、分叉、迷你区块链、周复盘
- [ ] 第 8-14 天：PoS、共识对比、非对称加密、签名、默克尔树、节点类型、周复盘
- [ ] 第 15-21 天：以太坊、EVM、Gas、交易生命周期、计数器合约、事件、阶段复盘

### 技术文章（发表到博客 / GitHub / Mirror.xyz）
- [ ] 至少 3 篇公开发布的文章
