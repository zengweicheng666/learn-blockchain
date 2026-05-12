/**
 * MerkleTree 测试
 *
 * 运行: npx tsx test.ts
 */

import { MerkleTree, ProofNode } from "./merkle-tree";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ ${msg}`);
  }
}

// ─── 测试 1: 基础功能 ────────────────────────────────

console.log("\n[1] 基础构建与根哈希\n");

const txs1 = ["tx1", "tx2", "tx3", "tx4"];
const tree1 = new MerkleTree(txs1);

assert(tree1.getLeafCount() === 4, "叶子数应为 4");
assert(typeof tree1.getRoot() === "string" && tree1.getRoot().length === 64, "根哈希应为 64 字符 hex");

// ─── 测试 2: Proof 生成与验证 ────────────────────────

console.log("\n[2] Proof 生成与验证\n");

const txs2 = ["alice -> bob 10", "bob -> charlie 5", "charlie -> dave 2.5", "dave -> alice 1"];
const tree2 = new MerkleTree(txs2);
const root = tree2.getRoot();

// 验证每个叶子
for (const tx of txs2) {
  const { proof, index } = tree2.getProof(tx);
  const isValid = MerkleTree.verifyProof(tx, proof, root);
  assert(isValid, `"${tx}" 的 Proof 验证通过`);
}

// ─── 测试 3: 篡改检测 ────────────────────────────────

console.log("\n[3] 篡改检测\n");

const tamperedProof = tree2.getProof(txs2[1]);
assert(
  !MerkleTree.verifyProof("fake tx", tamperedProof.proof, root),
  "篡改消息后验证失败"
);

// ─── 测试 4: 奇数叶子 ────────────────────────────────

console.log("\n[4] 奇数叶子（自动补全）\n");

const txs3 = ["a", "b", "c"];
const tree3 = new MerkleTree(txs3);

const proofA = tree3.getProof("a");
assert(
  MerkleTree.verifyProof("a", proofA.proof, tree3.getRoot()),
  "奇数叶子的 Proof 验证通过"
);

// ─── 测试 5: 空树异常 ────────────────────────────────

console.log("\n[5] 边界情况\n");

try {
  new MerkleTree([]);
  assert(false, "空叶子应抛出异常");
} catch {
  assert(true, "空叶子抛出异常");
}

// ─── 汇总 ────────────────────────────────────────────

console.log(`\n${"=".repeat(40)}`);
console.log(`  结果: ${passed} 通过, ${failed} 失败`);
console.log(`${"=".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
