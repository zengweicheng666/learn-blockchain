import { createHash } from "node:crypto";

/**
 * PoW 工作量证明模拟器
 *
 * 模拟矿工寻找有效 Nonce 的过程：
 * 递增 Nonce → SHA256(区块数据 + Nonce) → 检查是否满足难度条件
 */

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * 模拟挖矿：查找一个满足难度条件的 Nonce
 * @param blockData 区块数据（交易摘要 + 前块哈希等）
 * @param difficulty 难度（要求哈希以 difficulty 个零开头）
 * @param maxAttempts 最多尝试次数（防死循环）
 */
function mine(
  blockData: string,
  difficulty: number,
  maxAttempts = 5_000_000
): { nonce: number; hash: string; attempts: number } | null {
  const target = "0".repeat(difficulty);
  const startTime = Date.now();

  for (let nonce = 0; nonce < maxAttempts; nonce++) {
    const hash = sha256(`${blockData}${nonce}`);
    if (hash.startsWith(target)) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  找到! nonce=${nonce}, 耗时 ${elapsed}秒`);
      return { nonce, hash, attempts: nonce + 1 };
    }

    // 每 10 万次输出进度
    if (nonce > 0 && nonce % 100_000 === 0) {
      // 只输出中间进度，不刷屏
    }
  }

  return null;
}

// === 测试 ===

const blockData = "Block #100 | PrevHash: 0000abc... | TXs: Alice→Bob, Charlie→DEX";

console.log("=== PoW 模拟器 ===");
console.log(`区块数据: "${blockData}"`);
console.log("");

// 测试不同难度级别
for (const difficulty of [3, 4, 5]) {
  console.log(`\n难度: 要求哈希以 ${difficulty} 个零开头`);
  console.log(`目标前缀: "${"0".repeat(difficulty)}"`);
  console.log("-".repeat(40));

  const startTime = Date.now();
  const result = mine(blockData, difficulty);

  if (result) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`  哈希: ${result.hash}`);
    console.log(`  尝试次数: ${result.attempts.toLocaleString()}`);
    console.log(`  耗时: ${elapsed}秒`);
  } else {
    console.log(`  在限制次数内未找到有效 Nonce`);
  }
}
