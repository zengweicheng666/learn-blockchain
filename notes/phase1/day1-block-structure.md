# 第 1 天：区块结构

日期：2026-05-12

## 区块里有什么

### 区块头 (Block Header)

- **Parent Hash（父哈希）：**上一个区块整体的哈希，不是交易的公钥哈希。
- **Timestamp（时间戳）：** 验证者打包区块时的 Unix 时间戳，单位秒。用于让全节点确认区块的时间顺序。
- **Nonce：** 就是“工作量证明” –证明矿工确实花了算力去找它。
- **Merkle Root（默克尔根）：** 是一条数学指纹，用一个哈希值概括了区块里所有交易。
- **Difficulty / Gas Limit：** Difficulty 是 PoW 时代控制出块速度的旋钮。以太坊转 PoS 后不再需要，因为出块时间固定在 12 秒。Gas Limit 控制的是区块大小上限（目标30M，上限 60M），两者不同。

### 区块体 (Block Body)

- **交易列表（Transactions）：** 交易列表就是区块里实际装的东西-区块是容器，交易是内容。区块链不是一个存余额的账本，而是一个存交易记录的账本。

## 实操：我在 Etherscan 上看到的区块

- 区块高度（Block Height）：25075640
- 出块时间（Timestamp）：1778548019
- Gas Used / Gas Limit：21,317,620(35.53%) - 60,000,000
- 包含交易数：[160 transactions](https://etherscan.io/txs?block=25075640) and [73 contract internal transactions](https://etherscan.io/txsInternal?block=25075640) in this block
- Fee Recipient（验证者/矿工）：0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97

从区块中追踪一笔交易，我注意到：


## 我的理解（用自己的话写）

区块通过哈希指针连成链：区块 A 的哈希 → 写在区块 B 的 Parent Hash 字段 → 区块 B 的哈希 → 写在区块 C 的 Parent Hash 字段，如果有人在历史中篡改了区块 A，区块 A 的哈希就会变，区块 B 的 Parent Hash 就对不上，整条链就断了。这就是"区块链不可篡改"的核心机制。

## 疑问

1. 以太币，比特币，等个中小币各自的优缺点。
2. MerkleRoot 默克尔根是区块里所有交易的唯一标识？
3. 
