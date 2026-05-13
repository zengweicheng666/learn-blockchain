# DApp 全功能 E2E 测试报告（Playwright）

**测试日期**: 2026-05-13
**测试工具**: Playwright + Chromium + 注入 window.ethereum
**测试网络**: Hardhat Local (Chain 31337)
**合约地址**:
- NFTMarketplace: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- AuctionManager: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- DAO: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
- VoteToken: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- Staking: `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853`
- TestERC721: `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d`

---

## 测试结果摘要

| 结果 | 数量 |
|------|------|
| ✅ 通过 | 25 |
| ❌ 失败 | 0 |
| 总计 | 25 |
| 通过率 | 100.0% |

---

## 详细测试步骤

1. ✅ [01] 环境验证 - Hardhat 节点
2. ✅ [02] 环境验证 - 合约已部署
3. ✅ [03] 测试数据准备 - 部署 TestERC721
4. ✅ [04] 测试数据准备 - 铸造 NFT 给卖家
5. ✅ [05] 测试数据准备 - 卖家授权 Marketplace
6. ✅ [06] 测试数据准备 - 卖家授权 AuctionManager
7. ✅ [07] 页面渲染 - Home 首页
8. ✅ [08] 页面渲染 - 导航栏
9. ✅ [09] 页面渲染 - Market 市场
10. ✅ [10] 页面渲染 - DAO
11. ✅ [11] 页面渲染 - Stake
12. ✅ [12] 页面渲染 - Listings 子页面
13. ✅ [13] 页面渲染 - Auctions 子页面
14. ✅ [14] 页面渲染 - My Items 子页面
15. ✅ [15] Marketplace - 上架 NFT (List Item)
16. ✅ [16] Marketplace - 购买 NFT (Buy Item)
17. ✅ [17] Marketplace - 取消上架 (Cancel Listing)
18. ✅ [18] Auction - 创建拍卖 (Create Auction)
19. ✅ [19] Auction - 出价 (Place Bid)
20. ✅ [20] Auction - 结束拍卖 (End Auction)
21. ✅ [21] DAO - 创建提案 (Create Proposal)
22. ✅ [22] DAO - 投票 (Vote)
23. ✅ [23] DAO - 执行提案 (Execute Proposal)
24. ✅ [24] Staking - 质押 ETH (Stake)
25. ✅ [25] Staking - 解除质押 (Unstake)



---

## 功能点覆盖

| 模块 | 功能点 | 状态 |
|------|--------|------|
| 环境 | Hardhat 节点连通 | ✅ |
| 环境 | 合约已部署验证 | ✅ |
| 测试数据 | 部署 TestERC721 | ✅ |
| 测试数据 | 铸造 Token 1,2,3 | ✅ |
| 测试数据 | 授权 Marketplace | ✅ |
| 测试数据 | 授权 AuctionManager | ✅ |
| 页面渲染 | Home 首页 | ✅ |
| 页面渲染 | 导航栏 | ✅ |
| 页面渲染 | Market 页面 | ✅ |
| 页面渲染 | DAO 页面 | ✅ |
| 页面渲染 | Stake 页面 | ✅ |
| 页面渲染 | Listings 子页面 | ✅ |
| 页面渲染 | Auctions 子页面 | ✅ |
| 页面渲染 | My Items 子页面 | ✅ |
| Marketplace | 上架 NFT（listItem） | ✅ |
| Marketplace | 购买 NFT（buyItem） | ✅ |
| Marketplace | 取消上架（cancelListing） | ✅ |
| Auction | 创建拍卖（createAuction） | ✅ |
| Auction | 出价（placeBid） | ✅ |
| Auction | 结束拍卖（endAuction） | ✅ |
| DAO | 创建提案（propose） | ✅ |
| DAO | 投票（vote） | ✅ |
| DAO | 执行提案（execute） | ✅ |
| Staking | 质押 ETH（stake） | ✅ |
| Staking | 解除质押（unstake） | ✅ |

---

## 操作流程与输入输出

### Marketplace 上架

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（卖家） | seller account | 页面显示已连接 |
| 2 | 填写 NFT 合约地址 | `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` | 表单已填充 |
| 3 | 填写 Token ID | `1` | 表单已填充 |
| 4 | 填写价格 | `5 ETH` | 表单已填充 |
| 5 | 点击 List Item | - | 交易发送 |
| 6 | 等待确认 | - | Confirmed! |
| 7 | 验证链上 | - | listingCount=1, active=true |

### Marketplace 购买

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（买家） | buyer account | 页面显示已连接 |
| 2 | 填写 Listing ID | `1` | 显示挂单详情 |
| 3 | 验证价格 | - | Price: 5.0 ETH |
| 4 | 点击 Buy | - | 交易发送（含 2.5% 费） |
| 5 | 等待确认 | - | Confirmed! |
| 6 | 验证链上 | - | NFT 归买家, active=false |

### Marketplace 取消上架

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 卖家连接钱包 | seller account | 页面显示已连接 |
| 2 | 填写 Listing ID | `2` | 显示挂单详情 + Cancel 按钮 |
| 3 | 点击 Cancel | - | 交易发送 |
| 4 | 等待确认 | - | Confirmed! |
| 5 | 验证链上 | - | active=false |

### Auction 创建拍卖

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（卖家） | seller account | 页面显示已连接 |
| 2 | 填写 NFT 合约地址 | `0xc6e7DF5E7b4f2A278906862b61205850344D4e7d` | 表单已填充 |
| 3 | 填写 Token ID | `3` | 表单已填充 |
| 4 | 填写起拍价 | `1 ETH` | 表单已填充 |
| 5 | 填写时长 | `3600s` | 表单已填充 |
| 6 | 点击 Create Auction | - | 交易发送 |
| 7 | 验证链上 | - | auctionCount=1, active=true |

### Auction 出价

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（买家） | buyer account | 页面显示已连接 |
| 2 | 填写 Auction ID | `1` | 显示拍卖详情 |
| 3 | 填写出价 | `2 ETH` | 表单已填充 |
| 4 | 点击 Place Bid | - | 交易发送 |
| 5 | 验证链上 | - | highestBid=2 ETH, buyer 最高 |

### Auction 结束拍卖

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 快进时间 | +3601s | 硬分叉推进 |
| 2 | 连接钱包 | buyer account | 页面显示已连接 |
| 3 | 填写 Auction ID | `1` | End Auction 按钮可见 |
| 4 | 点击 End Auction | - | 交易发送 |
| 5 | 验证链上 | - | ended=true, NFT 归买家 |

### DAO 提案

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包 | deployer account | 页面显示已连接 |
| 2 | 创建提案 | target, value=0, data=0x, desc="测试提案" | proposalCount 增加 |
| 3 | 投票 | proposalId, support=1(For) | Proposal state=succeeded |
| 4 | 执行提案 | proposalId | Proposal state=executed |

### Staking 质押/解押

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包 | staker account | 页面显示已连接 |
| 2 | 质押 ETH | 10 ETH | stETH 余额 > 0 |
| 3 | 解除质押 | 50% stETH | stETH 余额减少 |

---

## 测试结论

**所有 25 个功能点测试通过。** DApp 在本地 Hardhat 网络上运行正常，链感知配置正确，全部合约功能可正常交互。
