/**
 * light-client-demo.ts
 *
 * 模拟轻节点如何利用 Merkle Proof 验证交易存在。
 *
 * 场景：
 * - 矿工（全节点）打包了 8 笔交易，构建 Merkle 树，将根哈希写入区块头
 * - 轻节点只存储区块头（只存了根哈希）
 * - 轻节点想验证 "tx5" 是否在区块中
 * - 矿工提供 tx5 的 Merkle Proof（4 个兄弟哈希）
 * - 轻节点用 4 步计算验证 root 是否匹配
 */

import { MerkleTree } from "./merkle-tree";

// ── 1. 矿工打包交易 ───────────────────────────────────

console.log("=".repeat(60));
console.log("  轻节点验证演示 — Merkle Proof");
console.log("=".repeat(60));

const txs = [
  "alice -> bob 2.5 ETH",
  "bob -> charlie 1.0 ETH",
  "charlie -> dave 0.5 ETH",
  "dave -> alice 3.0 ETH",
  "eve -> frank 7.0 ETH",    // ← 我们要验证这笔
  "frank -> grace 1.5 ETH",
  "grace -> bob 2.0 ETH",
  "bob -> alice 0.8 ETH",
];

console.log(`\n  全节点打包 ${txs.length} 笔交易...\n`);

const tree = new MerkleTree(txs);
const merkleRoot = tree.getRoot();

console.log(`  Merkle Root: ${merkleRoot.slice(0, 40)}...`);
console.log(`  全节点将 Root 写入区块头\n`);

// ── 2. 轻节点存储 ────────────────────────────────────

console.log("─".repeat(60));
console.log("\n  [轻节点] 只存储区块头：");
console.log(`  Block #42 | Merkle Root: ${merkleRoot.slice(0, 40)}...`);
console.log(`  (${tree.getLeafCount()} 笔交易，但轻节点一条都没存)\n`);

// ── 3. 轻节点想验证一笔交易 ──────────────────────────

const targetTx = "eve -> frank 7.0 ETH";
console.log("─".repeat(60));
console.log(`\n  [轻节点] 请求验证交易: "${targetTx}"\n`);

// 全节点生成 Proof
const { proof } = tree.getProof(targetTx);
console.log(`  全节点返回 Proof (${proof.length} 个兄弟哈希):\n`);
for (const p of proof) {
  console.log(`    ${p.position.padEnd(5)} ${p.data.slice(0, 32)}...`);
}

// ── 4. 轻节点验证 ────────────────────────────────────

console.log("\n  [轻节点] 开始验证...\n");

const isValid = MerkleTree.verifyProof(targetTx, proof, merkleRoot);

console.log(`  计算路径:`);
let label = `    sha256("\\x00${targetTx}")`;
let currentProof = targetTx;
for (let i = 0; i < proof.length; i++) {
  const p = proof[i];
  currentProof = `hash(${p.position === "left" ? "proof + " + currentProof : currentProof + " + proof"})`;
}
console.log(`    → ${proof.length} 步计算后得到 Root`);

console.log(`\n  验证结果: ${isValid ? "✅ 交易存在于区块中！" : "❌ 验证失败"}`);

// ── 5. 篡改验证 ──────────────────────────────────────

const fakeTx = "eve -> frank 999 ETH";
const fakeValid = MerkleTree.verifyProof(fakeTx, proof, merkleRoot);
console.log(`\n  篡改交易后验证: ${!fakeValid ? "✅ 失败（篡改被检测）" : "❌ 异常通过"}`);

// ── 6. 对比：全节点 vs 轻节点 ────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log("  全节点 vs 轻节点 存储对比");
console.log("=".repeat(60));

const fullNodeStorage = txs.reduce((sum, t) => sum + t.length, 0);
const lightNodeStorage = merkleRoot.length; // 只存根哈希

console.log(`\n  全节点存储交易数据: ~${fullNodeStorage} 字节`);
console.log(`  轻节点存储根哈希:    ${lightNodeStorage} 字节`);
console.log(`  轻节点仅用 ${((lightNodeStorage / fullNodeStorage) * 100).toFixed(2)}% 的存储即可验证交易!\n`);
