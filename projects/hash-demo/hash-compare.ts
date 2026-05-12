import { createHash } from "node:crypto";

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * 比较两个十六进制哈希字符串，统计不同位（bit）的数量和比例
 */
function compareBitDiff(hash1: string, hash2: string): {
  bitDiffCount: number;
  totalBits: number;
  diffRatio: number;
} {
  let bitDiffCount = 0;
  const totalBits = hash1.length * 4; // 每个十六进制字符 = 4 bits

  for (let i = 0; i < hash1.length; i++) {
    const byte1 = parseInt(hash1[i], 16);
    const byte2 = parseInt(hash2[i], 16);
    const xor = byte1 ^ byte2; // 异或：相同位为 0，不同位为 1
    for (let b = 0; b < 4; b++) {
      if ((xor >> b) & 1) bitDiffCount++;
    }
  }

  return {
    bitDiffCount,
    totalBits,
    diffRatio: (bitDiffCount / totalBits) * 100,
  };
}

// === 测试用例 ===

const pairs = [
  ["hello", "hello"],       // 相同输入 → 应完全相同
  ["hello", "hellp"],       // 改一个字符
  ["hello", "Hello"],       // 大小写变化
  ["hello", "hello "],      // 多一个空格
  ["hello world", "hello World!"], // 长文本
];

for (const [a, b] of pairs) {
  const h1 = sha256(a);
  const h2 = sha256(b);
  const result = compareBitDiff(h1, h2);

  console.log(`"${a}" vs "${b}"`);
  console.log(`  hash1: ${h1}`);
  console.log(`  hash2: ${h2}`);
  console.log(
    `  差异: ${result.bitDiffCount}/${result.totalBits} bits (${result.diffRatio.toFixed(1)}%)`
  );
  console.log("");
}
