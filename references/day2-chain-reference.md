# 第 2 天：交易与链式结构 — 参考资料

## 哈希链：区块链为什么叫"链"

区块链的"链"指的是**区块头的哈希引用链**：

```
Genesis Block                    Block #1                        Block #2
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Block Header     │     │ Block Header     │     │ Block Header     │
│ ├ parent_hash: 0 │ ←── │ ├ parent_hash:   │ ←── │ ├ parent_hash:   │
│ ├ timestamp: T₀  │     │ │  Hash(GenHdr)  │     │ │  Hash(Blk1Hdr) │
│ ├ merkle_root: · │     │ ├ timestamp: T₁  │     │ ├ timestamp: T₂  │
│ └ nonce: ········│     │ ├ merkle_root: · │     │ ├ merkle_root: · │
│                   │     │ └ nonce: ········│     │ └ nonce: ········│
│ Body: [TXs]       │     │ Body: [TXs]       │     │ Body: [TXs]       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**关键点：**
- 每个区块的 parent_hash 字段 = 上一个区块头的哈希值
- 只要你改变了区块链上任何一个旧区块的数据 → 该区块的哈希就变了 → 下一个区块的 parent_hash 就对不上 → 链就断了
- 这就是不可篡改性的物理基础

## 创世区块 (Genesis Block)

- 区块链的**第一个区块**
- 它的 parent_hash = 0（全是零，没有父区块）
- 以太坊主网创世区块于 **2015 年 7 月 30 日** 诞生
- 以太坊创世区块哈希：`0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3`
- 可以在 etherscan 上直接搜索这个哈希看到

## 区块高度 (Block Height)

- **定义：** 从创世区块到当前区块的"距离"（创世区块高度 = 0）
- 以太坊当前高度大约是 25,075,640（你昨天看到的那个）
- 每分钟约产生 5 个区块（每 12 秒一个）
- 用途：快速定位一个区块在链上的位置

## 最长链原则

如果出现分叉（两个矿工同时出块），如何处理？

```
     ┌── Block A ── Block C ── Block E (5 blocks) ← 主链
Genesis
     └── Block B ── Block D (4 blocks) ← 被丢弃
```

- 哪条链累积的工作量（PoW）/ 证明量（PoS）最多，哪条就是**权威链**
- 最短的那条链叫"孤块"（ommer/uncle block），被丢弃
- 你作为用户，通常需要等 **6 个确认**（6 个后续区块）后才能基本确定交易不会被回滚

## Preethi 文章导读

文章地址：https://preethikasireddy.webflow.io/post/how-does-ethereum-work-anyway

篇幅较长（约 40 分钟阅读），建议重点读以下章节：
1. **"The blockchain paradigm"** — 区块链范式，理解为什么需要区块链
2. **"Anatomy of Blockchain"** — 区块结构拆解
3. **"The Ethereum blockchain"** — 以太坊的独特之处
4. **"Accounts as state"** — 账户状态（第 3 天也会覆盖）

剩余章节（PoW、Mining 等）第 4-5 天会覆盖，不用强求今天全读完。

## 今天实操步骤

```
1. 打开 https://etherscan.io/
2. 从你昨天看的区块 #25075640 开始
3. 点击该区块 → 复制它的 Parent Hash
4. 在搜索栏搜索这个 Parent Hash → 找到上一个区块
5. 重复 3-4，至少往回追溯 3 个区块
6. 观察：每个区块的 parent_hash 是否等于前一个区块的哈希？
```

## 小测试（读完文章后）

1. 以太坊的"状态"指的是什么？
2. 为什么说区块链是一个"账本"而不是一个"数据库"？
3. 如果不通过 parent_hash 链接，还可以通过什么方式链接区块？
