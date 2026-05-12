import { Blockchain } from "./blockchain";

// =====================
// 迷你区块链演示
// =====================

console.log("=== 迷你区块链演示 ===\n");

// 创建区块链，难度 = 4 个零
const chain = new Blockchain(4);

// 添加 3 个区块
chain.addBlock("Alice 转了 1 ETH 给 Bob");
chain.addBlock("Bob 转了 0.5 ETH 给 Charlie");
chain.addBlock("Charlie 铸造了 1 个 NFT");

// 打印链
console.log("\n📋 区块链完整状态:");
console.log("=".repeat(50));
for (const block of chain.chain) {
  console.log(`区块 #${block.index}`);
  console.log(`  data:      ${block.data}`);
  console.log(`  prevHash:  ${block.prevHash.slice(0, 20)}...`);
  console.log(`  hash:      ${block.hash}`);
  console.log(`  nonce:     ${block.nonce}`);
  console.log("");
}

// 验证链是否完整
console.log("🔍 验证区块链完整性...");
const valid = chain.isValid();
console.log(`  结果: ${valid ? "✅ 链完整，未被篡改" : "❌ 链被破坏"}`);

// 模拟篡改测试
console.log("\n🔨 模拟篡改测试:");
chain.tamper(1, "Alice 转了 10000 ETH 给自己");
console.log("🔍 再次验证完整性...");
const afterTamper = chain.isValid();
console.log(`  结果: ${afterTamper ? "✅ 链完整" : "❌ 链被破坏 — 篡改已被发现"}`);
