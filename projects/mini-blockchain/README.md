# 迷你区块链（Mini Blockchain）

用 TypeScript 实现的迷你区块链，包含 PoW 挖矿和链完整性验证。

## 结构

```
src/
├── block.ts       — 区块定义 + PoW 挖矿
├── blockchain.ts  — 区块链管理 + 完整性验证
└── index.ts       — 演示入口
```

## 运行

```bash
npx tsx src/index.ts
```

## 核心概念演示

- **链式结构：** 每个区块存储 prevHash 指向前一个区块
- **PoW 挖矿：** 递增 Nonce 直到 SHA256 哈希满足难度条件
- **不可篡改性：** 修改任何区块的数据 → 哈希不匹配 → isChainValid() 失败
