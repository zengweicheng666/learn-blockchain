# Week 5：拍卖合约

## 学习目标
- 理解英式拍卖（English Auction）合约设计
- 掌握 Pull over Push 退款模式
- 实现合约状态机管理（进行中 → 已结束 → 已结算）
- 编写完整的 Hardhat 测试

## 项目结构

```
projects/auction-contract/
├── contracts/Auction.sol    # 拍卖合约
├── contracts/TestNFT.sol     # 测试用 ERC721
├── test/Auction.test.js      # 22 个测试用例
├── scripts/deploy.js         # 部署脚本
├── hardhat.config.js         # Hardhat 配置
└── package.json              # 依赖
```

## 合约设计

### 拍卖流程
1. **部署** → 卖家部署 Auction，传入 NFT 地址、tokenId、起拍价、持续时间
2. **启动** → 卖家调用 `start()`，将 NFT 锁定到合约（托管模式）
3. **竞拍** → `bid()` 出价必须高于当前最高价
4. **退款** → `withdraw()` Pull 模式，被超出的竞拍者主动取回
5. **结算** → `auctionEnd()` 拍卖结束后将 NFT 转给胜出者，ETH 转给卖家
6. **取消** → `cancel()` 无人出价时可取消

### Pull over Push 模式

**Push（不推荐）**：合约自动向所有被超出的竞拍者发送 ETH
- 问题：某个竞拍者合约 fallback 失败会导致整体交易回滚（gas 爆炸）

**Pull（推荐）**：被超出的竞拍者主动调用 `withdraw()`
- 优点：失败不影响他人、gas 由取款人承担
- 实现：`pendingReturns[mapping]` 记录待提取金额

### 合约状态机

```
                start()
  [Created] ────────────→ [Active] ──────→ [Ended]
     │                                      │
     └── cancel() ──→ [Canceled]            │
                                           time
     auctionEnd() ──────────────────────────┘
```

### 授权流程
```
卖家 ──→ approve(拍卖合约, tokenId) ──→ start()
                                        │
                         ┌──────────────┘
                         ▼
                   transferFrom(卖家 → 合约)
```

## 核心知识点

### 状态管理
- `started`：拍卖是否已启动
- `endTime = startTime + duration`：拍卖截止时间
- `ended`：是否已结算/取消
- `auctionActive` 修改器：要求 `started && block.timestamp < endTime && !ended`

### 出价逻辑
- `msg.value >= startingBid`：不低于起拍价
- `msg.value > highestBid`：高于当前最高价
- `pendingReturns[highestBidder] += highestBid`：记录退款

### 时间操纵（Hardhat 测试）
- `evm_increaseTime`：快进区块时间
- `evm_mine`：挖出新区块

## 测试覆盖（22 个）

| 类别 | 测试 | 状态 |
|------|------|------|
| start | 卖家启动 | ✔ |
| start | 非卖家回滚 | ✔ |
| start | 重复启动回滚 | ✔ |
| start | 未授权回滚 | ✔ |
| bid | 正常出价 | ✔ |
| bid | 低于起拍价回滚 | ✔ |
| bid | 未超过最高价回滚 | ✔ |
| bid | 卖家出价回滚 | ✔ |
| bid | 结束后回滚 | ✔ |
| bid | 结算后回滚 | ✔ |
| withdraw | 被超出可取回 | ✔ |
| withdraw | 无可取回金额回滚 | ✔ |
| withdraw | 多人竞拍取回 | ✔ |
| auctionEnd | 有出价时正确结算 | ✔ |
| auctionEnd | 无人出价时退还 NFT | ✔ |
| auctionEnd | 结束前不能结算 | ✔ |
| auctionEnd | 不能重复结算 | ✔ |
| auctionEnd | 卖家收到 ETH | ✔ |
| cancel | 无人出价可取消 | ✔ |
| cancel | 有出价不能取消 | ✔ |
| cancel | 非卖家回滚 | ✔ |
| 集成 | 多人出价完整流程 | ✔ |

## 部署
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
