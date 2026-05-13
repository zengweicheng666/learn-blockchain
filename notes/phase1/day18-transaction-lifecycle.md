# 第 18 天：交易生命周期

日期：2026-05-12

## 学习目标

- [x] 理解一笔交易从创建到确认的完整 7 阶段流程
- [x] 理解 ABI 编码、ECDSA 签名、RLP 编码的作用
- [x] 理解交易池（Mempool）的运作机制
- [ ] 在 Sepolia 测试网上实操一笔交易

---

## 一、交易生命周期 7 阶段

```
┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
│ 创建  │ → │ 签名  │ → │ 编码  │ → │ 交易池│ → │ P2P │ → │ 打包  │ → │ 确认  │
│交易   │   │ECDSA │   │RLP   │   │mempool│   │广播  │   │执行   │   │最终性│
└──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘
 钱包        私钥       序列化      节点        网络       验证者      链上
```

### 阶段详解

| 阶段 | 做什么 | 参与方 |
|------|--------|--------|
| **① 创建** | 构造交易对象：nonce / to / value / data / gas 等 | 钱包/DApp |
| **② 签名** | 私钥对交易哈希做 ECDSA 签名，生成 (v, r, s) | 钱包（私钥） |
| **③ 序列化** | RLP 编码 → hex 字符串 | 钱包 → RPC 节点 |
| **④ 交易池** | 节点验证签名/nonce/余额 → 存入待处理池 | 节点 |
| **⑤ P2P 广播** | 节点间互相传播新交易 | 节点网络 |
| **⑥ 打包执行** | 验证者按小费高低选交易 → EVM 执行 → 状态更新 | 验证者 |
| **⑦ 确认** | 区块上链 → 后续区块确认 → Casper-FFG 最终性 | 共识层 |

---

## 二、交易数据结构

```
{
  nonce:      0,           // 发送者交易序号（从0递增）
  gasFeeCap:  50,          // 最高总费用（Gwei）
  gasTipCap:  2,           // 给小费（Gwei）
  gasLimit:   21000,       // Gas 上限
  to:         "0x...",     // 接收地址
  value:      "0x...",     // ETH 金额（wei）
  data:       "0x...",     // 合约调用的 ABI 编码
  chainId:    11155111,    // Sepolia 链 ID
  v, r, s:    "...",       // ECDSA 签名
}
```

### ABI 编码示例

调用 `transfer("0x...", 1000)` 时的 data 字段：

```
函数选择器: keccak256("transfer(address,uint256)")[:4]
          = 0xa9059cbb

data = 0xa9059cbb
       + 0000...地址(32字节)
       + 0000...金额(32字节)
```

---

## 三、交易池（Mempool）

### 双池架构（Geth）

```
交易池
  ├── LegacyPool → 所有普通交易
  │    ├── pending: 可以立刻打包的（nonce 正确、gas 足够）
  │    └── queue:  暂时不可打包的（nonce 不连续）
  └── BlobPool   → Blob 交易（EIP-4844，为 L2 设计）
```

### 验证规则

交易进入池前必须通过：

- 签名验证（ECDSA recover 出签名者地址）
- nonce 等于发送者当前 nonce
- 余额足够支付 Gas + 转账
- chainId 匹配
- 交易大小 ≤ 128KB

---

## 四、时间线

```
 0s     钱包创建交易 + ABI 编码
~0.5s   ECDSA 签名
~1s     RLP 编码 → 广播到节点
~2s     进入交易池 → P2P 广播全网
~12s    被验证者打包进区块 ✅  1 次确认
~24s    第二个区块确认
~1min   5 次确认
~13min  最终性（Finality，2 个 epoch）
```

---

## 五、实操：在 Sepolia 发一笔交易

> 条件：MetaMask 切换到 Sepolia 测试网 + 有测试 ETH

步骤：

1. 打开 MetaMask → 网络切换到 Sepolia
2. 发一笔 0 ETH 给自己（或任意地址）
3. 在 etherscan 上搜索交易哈希
4. 观察：Transaction Details 页面的 Status / Block / From / To / Gas Used / Base Fee

### 预期观察

```
Status:       Success
Block:        7654321
From:         你的地址
To:           你的地址（转给自己）
Gas Used:     21,000
Base Fee:     12 Gwei
Priority Fee: 1 Gwei
Tx Fee:       0.000273 ETH
```

---

## 六、学后自检

- [ ] 能说出交易生命周期的 7 个阶段
- [ ] 理解 nonce 的作用（防双花）
- [ ] 理解交易池 pending vs queue 的区别
- [ ] 知道 21,000 Gas 是基础转账的门槛

---

## 疑问记录

1. 交易卡在 pending 怎么办？——常见原因：nonce 不对（发送了 nonce=2 但实际 nonce=1 还没确认），或 Gas 设太低。可以发一笔相同 nonce 但更高 Gas 的交易来"加速"
2. 交易发送后还能取消吗？——不能直接取消，但可以发一笔相同 nonce、value=0、高 Gas 的交易给自己来"覆盖"
3.
