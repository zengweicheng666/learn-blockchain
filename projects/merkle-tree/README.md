# 默克尔树

TypeScript 实现的 Merkle Tree（默克尔树），包含轻节点验证演示。

## 环境

- Node.js `>=18`
- 依赖: `npx tsx`

## 结构

```
merkle-tree.ts          — 默克尔树核心实现
light-client-demo.ts    — 轻节点验证演示
test.ts                 — 单元测试
```

## 运行

```bash
npx tsx test.ts
npx tsx light-client-demo.ts
```

## 核心概念

- **二叉哈希树:** 叶子节点存数据，父节点存子节点哈希
- **Merkle Proof:** O(log n) 即可验证某个叶子是否存在
- **第二原像攻击防护:** 叶子节点加 `0x00` 前缀，中间节点加 `0x01` 前缀
