# Week 6：简易 AMM 去中心化交易所

## 学习目标
- 理解恒定乘积做市商 x * y = k
- 实现添加/移除流动性
- 实现代币兑换（含 0.3% 手续费）
- 掌握滑点保护机制

## 项目结构

```
projects/amm-contract/
├── contracts/SimpleAMM.sol   # AMM 合约
├── contracts/TestToken.sol    # 测试用 ERC20
├── test/SimpleAMM.test.js     # 17 个测试用例
├── scripts/deploy.js          # 部署脚本
├── hardhat.config.js          # Hardhat 配置
└── package.json               # 依赖
```

## 核心公式

### 恒定乘积
```
x * y = k

x = reserveA（代币 A 储备量）
y = reserveB（代币 B 储备量）
k = 常数（乘积不变）
```

### 兑换计算（含 0.3% 手续费）
```
Δout = reserveOut * (Δin * 997/1000) / (reserveIn + Δin * 997/1000)
```

### 添加流动性
- 首次添加：LP 份额 = sqrt(amountA * amountB)
- 后续添加：按当前池子比例添加，LP 份额 = min(ΔA/reserveA, ΔB/reserveB) * totalSupply

### 移出流动性
```
amountA = reserveA * shares / totalSupply
amountB = reserveB * shares / totalSupply
```

## 合约设计

### LP 代币
合约继承 ERC20，LP 份额本身就是 ERC20 代币：
- 添加流动性时 `_mint`
- 移除流动性时 `_burn`
- 可自由转账

### 内部排序
AMM 合约内部自动按地址排序两个代币，外部无需关心传入顺序。

### 手续费
- 0.3% 手续费累加到池子（k 值缓慢增长）
- 手续费归 LP 提供者所有

## 运行测试

```bash
# 运行全部测试
npx hardhat test

# 显示 gas 报告
npx hardhat test --gas
```

## 测试覆盖（17 个）

| 类别 | 测试 | 状态 |
|------|------|------|
| addLiquidity | 首次添加 | ✔ |
| addLiquidity | LP 份额计算 sqrt(a*b) | ✔ |
| addLiquidity | 按比例添加 | ✔ |
| addLiquidity | 非比例自动调整 | ✔ |
| addLiquidity | 0 份额回滚 | ✔ |
| removeLiquidity | 全部移除 | ✔ |
| removeLiquidity | 部分移除 | ✔ |
| removeLiquidity | 0 份额回滚 | ✔ |
| removeLiquidity | LP 不足回滚 | ✔ |
| swap | A → B | ✔ |
| swap | B → A | ✔ |
| swap | 滑点保护 | ✔ |
| swap | k 恒定验证 | ✔ |
| swap | 无效代币回滚 | ✔ |
| swap | 零金额回滚 | ✔ |
| 集成 | 完整流程（添加→兑换→移除） | ✔ |
| 集成 | 多 LP 添加 | ✔ |

## 部署

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
