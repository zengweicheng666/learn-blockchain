# Week 7：DAO 投票合约

## 学习目标
- 理解 DAO 治理模型（提案 → 投票 → 执行）
- 掌握 ERC20Votes 委托投票机制
- 实现提案状态机
- 编写完整的治理合约

## 项目结构

```
projects/dao-contract/
├── contracts/VoteToken.sol    # 治理代币（ERC20 + ERC20Votes）
├── contracts/SimpleDAO.sol    # DAO 治理合约
├── contracts/SimpleTarget.sol # 目标合约（DAO 控制对象）
├── test/Dao.test.js           # 19 个测试用例
├── scripts/deploy.js          # 部署脚本
├── hardhat.config.js          # Hardhat 配置
└── package.json               # 依赖
```

## 核心概念

### 委托投票（Delegation）
```
持有代币 → 委托(delegate) → 获得投票权
     │                        │
转账时自动更新              提案时快照锁定
```

代币持有者必须主动调用 `delegate(address)` 才能激活投票权。转账时投票权自动跟随代币转移。

### 提案状态机
```
                ┌── 投票通过 ──→ Succeeded ──→ Executed
创建 ──→ Pending ──→ Active ┤
                └── 投票失败 ──→ Defeated
创建后可被提案人 Cancel ──→ Canceled
```

### 快照投票（ERC20Votes）
- `getPastVotes(account, blockNumber)`：查询历史区块的投票权
- 防止投票后转移代币操纵投票（投票权在提案开始时锁定）
- 每次转账自动记录 checkpoint

## 合约设计

### VoteToken
- 继承 ERC20 + ERC20Permit + ERC20Votes
- `mint`：铸造代币
- `delegate`：委托投票权（由 ERC20Votes 提供）
- `getVotes`：当前投票权
- `getPastVotes`：历史区块投票权

### SimpleDAO
- `propose(target, value, data, description)`：创建提案
- `vote(proposalId, support)`：投票（0=反对，1=赞成，2=弃权）
- `execute(proposalId)`：执行通过的提案
- `cancel(proposalId)`：提案人取消
- `getState(proposalId)`：查询提案状态
- `proposalThreshold`：创建提案的最低投票权

## 运行测试

```bash
# 运行全部测试
npx hardhat test

# 显示 gas 报告
npx hardhat test --gas
```

## 测试覆盖（19 个）

| 类别 | 测试 | 状态 |
|------|------|------|
| VoteToken | 委托后投票权正确 | ✔ |
| VoteToken | 未委托投票权为 0 | ✔ |
| VoteToken | 转账后自动更新 | ✔ |
| propose | 有权限创建 | ✔ |
| propose | 权限不足回滚 | ✔ |
| vote | 赞成 | ✔ |
| vote | 反对 | ✔ |
| vote | 弃权 | ✔ |
| vote | 重复投票回滚 | ✔ |
| getState | 初始 Pending | ✔ |
| getState | 赞成>反对 Defeated | ✔ |
| getState | 赞成>反对 Succeeded | ✔ |
| execute | 成功执行 | ✔ |
| execute | 未结束不能执行 | ✔ |
| execute | 不能重复执行 | ✔ |
| cancel | 提案人取消 | ✔ |
| cancel | 非提案人回滚 | ✔ |
| cancel | 已执行不能取消 | ✔ |
| 集成 | 完整治理流程 | ✔ |

## 部署

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
