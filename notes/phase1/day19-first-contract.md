# 第 19 天：第一个 Solidity 合约

日期：2026-05-12

## 学习目标

- [ ] 理解 Solidity 合约的基本结构
- [ ] 能用 Remix IDE 编译 + 部署合约
- [ ] 理解状态变量、函数、事件三大要素
- [ ] 部署到 Sepolia 测试网

---

## 一、Counter 合约结构

```
contract Counter {
    // 1. 状态变量（存在链上）
    uint256 private count;

    // 2. 事件（链上日志）
    event CountChanged(uint256 newCount);

    // 3. 构造函数（部署时执行一次）
    constructor() { count = 0; }

    // 4. 写函数（修改状态，需要 Gas）
    function increment() external { ... }

    // 5. 读函数（不修改状态，免费）
    function getCount() external view returns (uint256) { ... }
}
```

### Solidity 关键概念

| 概念 | 说明 |
|------|------|
| `contract` | 类似其他语言的 class |
| `uint256` | 256 位无符号整数（EVM 的原生字长） |
| `external` | 函数可见性——仅外部可调用 |
| `view` | 承诺不修改链上状态（不花 Gas） |
| `require` | 条件检查，失败则回滚 |
| `event` | 链上日志，供链下应用监听 |
| `emit` | 触发事件 |

---

## 二、Remix IDE 操作步骤

### 在线 IDE

```
打开 https://remix.ethereum.org
  → 创建新文件 Counter.sol
  → 粘贴合约代码
  → Ctrl+S 编译（自动检测 Solidity 版本）
  → 切换到 Deploy 标签页
  → 选择环境（Remix VM 或 Injected Provider）
  → 点击 Deploy
```

### 本地测试（Remix VM）

1. 环境选择：Remix VM（内置虚拟机，免费，无需钱包）
2. 部署合约 → 下方显示已部署合约
3. 点击 `increment` → 看 count 变化
4. 点击 `getCount` → 看返回值
5. 观察每次 `increment` 后下方的 Log 输出（CountChanged 事件）

---

## 三、部署到 Sepolia

### 前置条件

- [ ] MetaMask 已安装
- [ ] MetaMask 切换到 Sepolia 测试网
- [ ] 有测试 ETH（从 faucet 领取）

### 部署步骤

1. Remix 环境切换为 "Injected Provider — MetaMask"
2. MetaMask 弹出确认 → 连接
3. Remix 显示你的账户地址和余额
4. 点击 Deploy → MetaMask 弹出交易确认
5. 确认 → 等待交易上链（~12 秒）
6. 复制部署地址 → 在 sepolia.etherscan.io 上查看

### 部署后交互

```
合约地址: 0x...
在 etherscan 上可以：
  - Read Contract → getCount
  - Write Contract → increment / decrement（需要连接钱包）
  - 查看 Transaction 和 Event 日志
```

---

## 四、合约源码

> 见 `projects/first-contract/Counter.sol`

```
┌─────────────────────────────────────────────┐
│ 部署地址: [待填写]                            │
│ 交易哈希: [待填写]                            │
│ Etherscan: [待填写]                          │
└─────────────────────────────────────────────┘
```

---

## 五、学后自检

- [ ] 能写出一个简单的 Counter 合约
- [ ] 理解 external / view / payable 等可见性关键字
- [ ] 理解 event 的作用
- [ ] 会在 Remix 中部署和测试合约

---

## 疑问记录

1.
2.
3.
