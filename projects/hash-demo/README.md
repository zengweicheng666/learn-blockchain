# 密码学演示脚本

SHA256 哈希、PoW 模拟、ECDSA 密钥生成和以太坊签名演示。

## 环境

- Node.js `>=18`
- 依赖: `npx tsx`（TypeScript 直接运行）

## 脚本

| 文件 | 说明 |
|------|------|
| `hash-compare.ts` | SHA256 雪崩效应演示 |
| `pow-simulator.ts` | PoW 挖矿模拟（递增 Nonce） |
| `ecdsa-keygen.js` | ECDSA 密钥生成示例 |
| `ethereum-sign-demo.js` | 以太坊签名和地址推导 |

## 运行

```bash
npx tsx hash-compare.ts
npx tsx pow-simulator.ts
node ecdsa-keygen.js
node ethereum-sign-demo.js
```
