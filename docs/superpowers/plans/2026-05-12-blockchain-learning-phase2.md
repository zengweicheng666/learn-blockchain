# 区块链学习计划 · 阶段二：Solidity + Mini 项目（第 4-8 周）

> **说明：** 每周一个 Mini 项目，每周末有可展示的交付物。Hardhat 作为主力开发框架。每个合约必须有单元测试。

**目标：** 掌握 Solidity 语言，写出经过测试的安全合约，部署到 Sepolia 测试网

**前置条件：** 已完成阶段一，有 Remix 使用经验

---

## 第四周：ERC20 代币合约

### 技术预学（第 1-2 天）

- [ ] **第 1 天：Solidity 基础语法**
  - 安装 Hardhat：`npm init -y && npm install hardhat @nomicfoundation/hardhat-toolbox && npx hardhat init`
  - 学：类型（uint、address、string、mapping、struct）、可见性（public/internal/external/private）
  - 练：写一个简单合约，用 mapping 存储地址到余额的映射
  - **产出：** `projects/erc20-token/hardhat.config.js` + 基础测试环境跑通

- [ ] **第 2 天：ERC20 标准接口**
  - 学：ERC20 标准函数（totalSupply、balanceOf、transfer、approve、transferFrom、allowance）
  - 学：OpenZeppelin 的 ERC20 合约集成
  - 练：`npm install @openzeppelin/contracts`，写一个继承 OpenZeppelin ERC20 的代币合约
  - 写一个基础测试：部署合约，检查 name/symbol/decimals
  - **产出：** `contracts/MyToken.sol` + `test/MyToken.test.js`

### 项目开发（第 3-5 天）

- [ ] **第 3 天：实现完整 ERC20 功能**
  - 添加 `mint(address to, uint amount)` 函数（仅 owner 可调用）
  - 添加 `burn(uint amount)` 函数（任何持币者可销毁自己的币）
  - 添加 `Transfer` 事件追踪
  - 写测试：正常转账、余额不足转账（应 revert）、approve + transferFrom 流程
  - **产出：** 完整的 ERC20 合约 + 测试覆盖率 80%+

- [ ] **第 4 天：安全加固 + 部署**
  - 检查：重入防护、溢出防护（Solidity 0.8+ 自带但确认）、权限控制
  - 写部署脚本：`scripts/deploy.js`，部署到本地 Hardhat Network
  - 部署到 Sepolia 测试网
  - **产出：** 已在 Sepolia 验证的 ERC20 合约

- [ ] **第 5 天：合约验证 + 交互**
  - 在 etherscan 上验证合约源码（hardhat-etherscan 插件）
  - 在 Remix 或 etherscan 的 Write Contract 面板中 mint 和 transfer
  - 写一个简单前端脚本（Node.js + ethers.js）：连接合约，查询余额
  - **产出：** 已验证的合约 + 前端交互脚本

### 复盘（第 6-7 天）

- [ ] **第 6-7 天：完善文档 + 复盘**
  - 写 README：项目说明、合约地址、功能列表
  - 整理代码，确保测试全部通过
  - 提交到 GitHub
  - **复盘检查清单：**
    - [ ] ERC20 标准接口全部实现
    - [ ] 测试覆盖了正常路径 + 异常路径（余额不足、授权不足）
    - [ ] 合约在 Sepolia 上已验证
    - [ ] README 完整

---

## 第五周：NFT 铸造合约（ERC721）

### 技术预学（第 1 天）

- [ ] **第 1 天：ERC721 标准**
  - 学：ERC721 核心接口（balanceOf、ownerOf、safeTransferFrom、approve、getApproved）
  - 理解：ERC721 与 ERC20 的区别（非同质化 vs 同质化）
  - 练：`npx hardhat init` 新项目，集成 OpenZeppelin ERC721
  - **产出：** 新 Hardhat 项目 `projects/nft-contract/`

### 项目开发（第 2-5 天）

- [ ] **第 2 天：NFT 铸造逻辑**
  - 实现 `safeMint(address to, uint tokenId)` 函数
  - 实现 `tokenURI(uint tokenId)` 返回元数据 JSON 链接
  - 准备一个示例元数据 JSON（上传到 IPFS 或使用公共 URL）
  - 写测试：铸造一个 NFT，检查 owner 是否正确
  - **产出：** NFT 合约 + 元数据文件

- [ ] **第 3 天：铸造限额 + 白名单**
  - 添加 `maxSupply` 限制（最多 10000 个）
  - 添加 `publicSalePrice`（公开销售价格 0.01 ETH）
  - 添加 `whitelistMint`（白名单地址可提前 mint）
  - 写测试：超过 maxSupply 应 revert、未在白名单应 revert
  - **产出：** 带销售逻辑的完整 NFT 合约

- [ ] **第 4 天：安全和部署**
  - 检查：重入防护（mint 函数）、权限控制（ownerOnly）、ETH 收款逻辑
  - 部署到 Sepolia 测试网
  - 在 etherscan 验证合约
  - **产出：** 已部署和验证的 NFT 合约

- [ ] **第 5 天：前端集成**
  - 写一个简单 Node.js 脚本：连接钱包（私钥模式），调用 mint 函数铸造一个 NFT
  - 查看到账的 NFT（在 OpenSea 测试网或 etherscan 上）
  - **产出：** 铸造脚本 + NFT 在测试网上的截图

### 复盘（第 6-7 天）

- [ ] **第 6-7 天：文档 + 发布文章**
  - 写 README + 提交 GitHub
  - 发布第四篇技术文章："开发一个 NFT 铸造合约需要几步"
  - **复盘检查清单：**
    - [ ] ERC721 标准接口全部实现
    - [ ] 铸造、白名单、限额逻辑完整
    - [ ] 测试覆盖所有核心功能
    - [ ] 合约在 Sepolia 上已验证

---

## 第六周：拍卖合约

### 技术预学（第 1 天）

- [ ] **第 1 天：拍卖模式设计**
  - 学：英式拍卖（公开增价）vs 荷兰式拍卖（降价）vs 密封投标拍卖
  - 设计一个"蜡烛拍卖"风格合约：一定时间内最高出价者获胜
  - 理清合约状态机：进行中 → 已结束 → 已结算
  - **产出：** 拍卖合约设计文档

### 项目开发（第 2-5 天）

- [ ] **第 2 天：出价逻辑**
  - 实现 `bid()` 函数：出价必须高于当前最高价，前一个出价者被退款
  - 实现 `withdraw()` 函数：被超出的竞拍者取回资金
  - 写测试：正常出价流程、出价不足应 revert
  - **产出：** 核心出价逻辑 + 测试

- [ ] **第 3 天：拍卖结束 + 结算**
  - 实现 `auctionEnd()` 函数：仅拍卖结束后可调用，将 NFT 转给最高出价者
  - 实现 `cancelAuction()`：拍卖未达到底价时取消
  - 写测试：提前结束应 revert、结算流程正确
  - **产出：** 完整拍卖合约 + 测试

- [ ] **第 4 天："拍卖撤回"模式（Pull over Push）**
  - 理解：为什么推荐用 withdraw 模式而不是自动 push 退款？
  - 重构退款逻辑为 Pull 模式（用户主动取回，避免 gas 爆炸）
  - 写测试：多人竞拍场景下 withdraw 的正确性
  - 参考 OpenZeppelin 的 ReentrancyGuard
  - **产出：** 安全加固后的拍卖合约

- [ ] **第 5 天：部署 + 端到端测试**
  - 部署到 Sepolia 测试网 + etherscan 验证
  - 写一个端到端测试脚本：部署 NFT → mint → 创建拍卖 → 出价 → 结束 → 验证胜出者
  - **产出：** 已验证的拍卖合约 + e2e 脚本

### 复盘（第 6-7 天）

- [ ] **第 6-7 天：完善 + 发布**
  - 整理 README + 提交 GitHub
  - 发布第五篇技术文章："智能合约拍卖机制设计：Pull over Push 模式"
  - **复盘检查清单：**
    - [ ] 拍卖状态机完整正确
    - [ ] Pull 模式退款已实现
    - [ ] 竞拍、结算、取消全部覆盖测试
    - [ ] 部署到 Sepolia

---

## 第七周：简易 AMM 去中心化交易所

### 技术预学（第 1-2 天）

- [ ] **第 1 天：AMM 原理**
  - 学：恒定乘积公式 x * y = k
  - 理解：流动性池、交易滑点、无常损失
  - 手动算一笔：ETH/USDC 池，ETH=100, USDC=10000，买 1 ETH 需要多少 USDC？新价格是多少？
  - **产出：** AMM 数学笔记

- [ ] **第 2 天：AMM 合约设计**
  - 学：Uniswap V2 核心流程（addLiquidity、removeLiquidity、swap）
  - 设计自己的迷你 AMM：单一个交易对（TokenA ↔ TokenB）
  - 确定接口：`addLiquidity(amountA, amountB)`、`removeLiquidity(shares)`、`swap(tokenIn, amountIn)`
  - **产出：** 迷你 AMM 设计文档

### 项目开发（第 3-5 天）

- [ ] **第 3 天：添加/移除流动性**
  - 实现 `addLiquidity(uint amountA, uint amountB)`：存入两种 Token，获得 LP 份额
  - 实现 `removeLiquidity(uint shares)`：销毁 LP 份额，取回对应比例的 Token
  - 实现 LP Token（继承 ERC20）作为流动性凭证
  - 写测试：添加流动性后池子余额正确、移除流动性后取回正确数量
  - **产出：** 流动性管理功能 + 测试

- [ ] **第 4 天：Swap 交易逻辑**
  - 实现 `swapAforB(uint amountAIn, uint minAmountBOut)` 和反向函数
  - 实现滑点保护（`minAmountOut` 参数）
  - 实现 0.3% 手续费（累加到 k 值中）
  - 写测试：正常 swap、滑点保护 revert、价格滑点计算
  - **产出：** 完整的 AMM 交易功能 + 测试

- [ ] **第 5 天：安全 + 部署**
  - 安全审查：闪电贷攻击风险告知（你的 AMM 对闪电贷的防护）、价格操纵
  - 部署到 Sepolia + 验证
  - 用部署后的合约做一笔真实 swap（通过 etherscan 或脚本）
  - **产出：** 已部署的 AMM 合约 + 交易记录

### 复盘（第 6-7 天）

- [ ] **第 6-7 天：完善 + 发布**
  - 整理 README + 提交 GitHub
  - 发布第六篇技术文章："从零写一个 AMM：恒定乘积做市商实战"
  - **复盘检查清单：**
    - [ ] AMM 数学公式正确实现
    - [ ] 流动性添加/移除、swap 全部通过测试
    - [ ] 滑点保护已实现
    - [ ] 部署到 Sepolia 测试网

---

## 第八周：DAO 投票合约

### 技术预学（第 1 天）

- [ ] **第 1 天：DAO 治理模型**
  - 学：Compound Governor 合约架构
  - 理解：治理代币 → 提案 → 投票 → 执行 的完整流程
  - 学：委托投票（Delegation）—— 让代币持有者将投票权委托给他人
  - **产出：** DAO 治理设计笔记

### 项目开发（第 2-5 天）

- [ ] **第 2 天：投票代币**
  - 实现 `VoteToken`（继承 ERC20Votes）：自动跟踪投票权
  - 实现 `delegate(address delegatee)`：将投票权委托
  - 写测试：转代币后投票权变化、委托后投票权归属
  - **产出：** 投票代币合约 + 测试

- [ ] **第 3 天：提案系统**
  - 实现 `propose(address[] targets, uint[] values, bytes[] calldatas, string description)`：创建提案
  - 实现 `vote(uint proposalId, uint8 support)`：投支持/反对/弃权
  - 实现 `state(uint proposalId)` 返回提案状态（待投票/已通过/已执行/已失败）
  - 写测试：创建提案、投票、状态流转
  - **产出：** 提案系统 + 测试

- [ ] **第 4 天：提案执行**
  - 实现 `execute(uint proposalId)`：投票通过的提案自动执行
  - 实现 `cancel(uint proposalId)`：仅提案人可取消
  - 集成 OpenZeppelin Governor 或自己实现 Timelock 控制
  - 写测试：完整治理流程（创建 → 投票 → 通过 → 执行）
  - **产出：** 完整 DAO 合约 + 测试

- [ ] **第 5 天：部署 + 验证**
  - 部署到 Sepolia 测试网 + etherscan 验证
  - 写一个端到端测试：部署治理代币 → 委托 → 创建提案 → 投票 → 执行
  - **产出：** 已部署的 DAO 治理系统

### 阶段复盘（第 6-7 天）

- [ ] **第 6-7 天：阶段二大复盘**
  - 整理 5 个项目的 README，统一格式
  - 确保所有代码已推送 GitHub
  - 发布第七篇技术文章："智能合约安全红线：我在写 5 个合约后总结的清单"
  - **阶段二复盘检查清单：**
    - [ ] 5 个合约项目全部完成、测试覆盖 80%+
    - [ ] 所有合约已部署到 Sepolia 测试网并验证
    - [ ] GitHub 上有完整的 5 个仓库/目录
    - [ ] 能说出 5 种以上智能合约攻击模式及防护方法
    - [ ] 对 Hardhat 开发流程已熟练
