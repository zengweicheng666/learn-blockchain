/**
 * day11-ethereum-sign-demo.js
 *
 * 以太坊签名流程实操：
 * 1. 生成 secp256k1 密钥对
 * 2. 从公钥推导以太坊地址
 * 3. 对消息签名 (ECDSA)
 * 4. 从签名恢复地址 (ecrecover)
 * 5. 篡改消息验证
 *
 * 使用: node -e "import('./ethereum-sign-demo.js')" 或用 CommonJS
 */

const crypto = require("crypto");

// ─── 辅助函数 ──────────────────────────────────────────

/** 字节数组转 hex 字符串 */
function toHex(buf) {
  return "0x" + Buffer.from(buf).toString("hex");
}

/** hex 转 Buffer */
function toBuf(hex) {
  return Buffer.from(hex.replace("0x", ""), "hex");
}

// ─── 1. 生成密钥对 ─────────────────────────────────────

console.log("=".repeat(70));
console.log("  以太坊签名流程演示");
console.log("=".repeat(70));

// 生成 secp256k1 密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "secp256k1",
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

// 提取原始私钥字节（PKCS8 中提取）
// Node.js 不直接暴露原始私钥标量，我们用签名再 recover 的方式演示
console.log("\n  密钥对已生成 (secp256k1)");

// 导出 PEM 用于签名
const { publicKey: pubPem, privateKey: privPem } =
  crypto.generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

// ─── 2. 从公钥推导地址 ─────────────────────────────────

// 从 PEM 公钥中提取原始公钥点
// SPKI 格式: 算法标识 + 曲线 OID + 公钥点
// 公钥点格式: 0x04 + x(32字节) + y(32字节)
function pubKeyToAddress(pem) {
  const key = crypto.createPublicKey(pem);
  // 导出为原始点格式 (raw/spki 的一种变体)
  // 用 JWK 方式拿到坐标
  const jwk = key.export({ format: "jwk" });
  const x = Buffer.from(jwk.x, "base64url");
  const y = Buffer.from(jwk.y, "base64url");

  // 未压缩公钥: 0x04 + x + y
  const uncompressed = Buffer.concat([
    Buffer.from([0x04]),
    x,
    y,
  ]);

  // 以太坊地址 = keccak256(公钥去掉0x04) 的后20字节
  // 注意: Node.js 内置 crypto 没有 keccak256, 我们用 SHA256 近似演示
  // 实际以太坊用的是 Keccak-256 (与 SHA3 不同)
  const hash = crypto.createHash("sha256").update(uncompressed.slice(1)).digest();
  const address = "0x" + hash.subarray(-20).toString("hex");

  return {
    address,
    uncompressedLength: uncompressed.length,
    x: x.length,
    y: y.length,
  };
}

const { address, uncompressedLength } = pubKeyToAddress(pubPem);

console.log(`\n  推导的地址: ${address}`);
console.log(`  未压缩公钥: ${uncompressedLength} 字节`);

// ─── 3. 签名 ──────────────────────────────────────────

const message = "Hello, Ethereum! 这是要签名的消息。";

const sign = crypto.createSign("SHA256");
sign.update(message);
sign.end();
const signature = sign.sign(privPem);

console.log(`\n  消息内容: "${message}"`);
console.log(`  签名 (hex): ${toHex(signature)}`);
console.log(`  签名长度: ${signature.length} 字节`);

// ─── 4. 验签 ──────────────────────────────────────────

const verify = crypto.createVerify("SHA256");
verify.update(message);
verify.end();
const isValid = verify.verify(pubPem, signature);

console.log(`\n  验签结果: ${isValid ? "✅ 通过" : "❌ 失败"}`);

// ─── 5. 篡改消息验证 ──────────────────────────────────

const tamperedMsg = "Hello, Ethereum! 这是被篡改的消息。";
const verify2 = crypto.createVerify("SHA256");
verify2.update(tamperedMsg);
verify2.end();
const isValid2 = verify2.verify(pubPem, signature);

console.log(`  篡改后验签: ${isValid2 ? "✅ 通过（异常！）" : "❌ 失败（符合预期）"}`);

// ─── 6. 模拟 ecrecover 概念 ───────────────────────────

console.log("\n  ─── ecrecover 原理 ───");
console.log(`  签名 (v, r, s) 包含在签名 DER 编码中`);
console.log(`  任何有签名 + 消息的人都可以 recover 出公钥`);
console.log(`  然后推导出地址，和声称的地址对比`);
console.log(`  这就是以太坊交易的验证方式`);

console.log("\n" + "=".repeat(70));
console.log("  结论：私钥签名 → 公钥验签 → 篡改可检测");
console.log("=".repeat(70));
