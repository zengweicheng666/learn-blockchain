# 第 20 天：合约事件（Event）

日期：2026-05-12

## 学习目标

- [x] 理解 Event 是以太坊的日志机制
- [x] 理解 `indexed` 关键字的用途
- [ ] 能在 Remix 和 Etherscan 中查看事件日志

---

## 一、什么是 Event？

> Event 是合约向链下世界"广播消息"的机制。合约 emit 事件 → 事件写入交易收据的日志区 → 链下应用通过 RPC 查询和监听。

```
                      EVM 执行合约
                           │
                    emit CountChanged(alice, 5)
                           │
                           ▼
                   交易收据 (Receipt)
                     ├── Status: Success
                     ├── Gas Used: 42000
                     └── Logs:  ← 事件存在这里
                          [CountChanged(alice, 5)]
                           │
                           ▼
                   链下应用 (前端/后端)
                   通过 ethers.js/web3.js 监听
```

### Event 的两种用途

| 用途 | 说明 | 例子 |
|------|------|------|
| **通知链下** | 前端 UI 监听事件，实时更新 | 交易完成弹窗 |
| **低成本存储** | 事件日志比 Storage 便宜很多 | 交易历史记录 |

---

## 二、indexed 关键字

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
                                  ↑                         ↑
                              可检索的"主题"          不可检索（数据）
```

| | 有 `indexed` | 无 `indexed` |
|--|-------------|-------------|
| 存储位置 | **Topic**（主题） | **Data**（数据） |
| 能否检索 | ✅ 可按值过滤 | ❌ 只能读全部 |
| 数量限制 | 最多 3 个 | 无限制 |
| Gas 成本 | 较高（存储在日志头） | 较低 |

### 如何在 ethers.js 中过滤

```javascript
// 监听所有转账给 addr1 的事件
contract.filters.Transfer(null, addr1)
// 返回: { address, topics: [null, null, addr1] }

// 监听
contract.on("Transfer", (from, to, value) => {
  console.log(`${from} 转账 ${value} 给 ${to}`);
});
```

---

## 三、Gas 对比：Event vs Storage

| 操作 | Gas | 说明 |
|------|-----|------|
| SSTORE（首次写入） | ~20,000 | 写入 Storage |
| SSTORE（修改） | ~5,000 | 修改 Storage |
| LOG0（无主题日志） | ~375 + 8/字节 | 纯事件日志 |
| LOG1（1 个主题） | ~375 + 8/字节 + 375（主题） | 事件日志 |

**事件比存储便宜 10-50 倍**，适合存历史记录类数据。

---

## 四、改造后的 Counter

`Counter.sol` 升级：`CountChanged` 事件现在包含调用者地址。

```solidity
event CountChanged(address indexed who, uint256 newCount);
//                        ↑ 可检索：可以按地址过滤
```

在 Remix 中交互后会看到：

```
[ ][ ][ ]  CountChanged
   who: 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4  (你的地址)
   newCount: 1
```

---

## 五、在 Etherscan 上查看事件

1. 在 etherscan 搜索你的合约地址
2. 点击 **Events** 选项卡
3. 可以看到所有历史事件日志
4. 点击某个事件展开 → 看到 Topic 和 Data

---

## 六、学后自检

- [ ] 理解 Event 是"日志"而非"存储"
- [ ] 理解 indexed 的作用（可检索 + Topic）
- [ ] 知道 Event 比 Storage 便宜多少
- [ ] 会在 Remix 中查看事件输出

---

## 疑问记录

1. 合约内部能不能读取自己发出的事件？——不能！Event 写入的是交易收据的日志区，而不是合约的 Storage。合约内部无法访问事件日志。如果合约需要读取过去的记录，必须用 Storage 变量
2. 事件会不会被链上状态 pruning 删除？——理论上全节点可以不存历史日志，但以太坊的共识要求全节点至少保留最近 128 个区块的状态。事件日志由每个节点自行决定存多久，归档节点永久保存
3.
