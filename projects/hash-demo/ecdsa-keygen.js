/**
 * day10-ecdsa-keygen.js
 *
 * 非对称加密实操脚本：
 * 1. 生成 RSA 2048 密钥对
 * 2. 生成 ECDSA P-256 密钥对
 * 3. 对比两种算法的密钥长度差异
 */

const crypto = require("crypto");

console.log("=".repeat(60));
console.log("  非对称加密 · 密钥生成对比");
console.log("=".repeat(60));

// ─── 1. RSA 2048 ──────────────────────────────────────────

console.log("\n[1] RSA 2048 密钥对\n");

const rsaPair = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

console.log("公钥（前 120 字符）:", rsaPair.publicKey.slice(0, 120) + "...");
console.log("公钥长度:", (rsaPair.publicKey.length / 1024).toFixed(1), "KB");
console.log("私钥长度:", (rsaPair.privateKey.length / 1024).toFixed(1), "KB");

// ─── 2. ECDSA P-256（prime256v1） ────────────────────────

console.log("\n[2] ECDSA P-256 密钥对\n");

const ecPair = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

console.log("公钥（前 120 字符）:", ecPair.publicKey.slice(0, 120) + "...");
console.log("公钥长度:", (ecPair.publicKey.length / 1024).toFixed(1), "KB");
console.log("私钥长度:", (ecPair.privateKey.length / 1024).toFixed(1), "KB");

// ─── 3. 对比 ─────────────────────────────────────────────

console.log("\n[3] 密钥长度对比\n");

console.log("  RSA 2048    公钥:", rsaPair.publicKey.length, "字节");
console.log("  ECDSA P-256 公钥:", ecPair.publicKey.length, "字节");
console.log(
  "  RSA / ECC   比值:",
  (rsaPair.publicKey.length / ecPair.publicKey.length).toFixed(1),
  "x"
);

// ─── 4. 用 ECDSA 签名 + 验签 ────────────────────────────

console.log("\n[4] ECDSA 签名与验签演示\n");

const message = "区块链学习第 10 天：非对称加密";
const sign = crypto.createSign("SHA256");
sign.update(message);
sign.end();
const signature = sign.sign(ecPair.privateKey);

console.log("消息内容:", message);
console.log("签名（hex）:", signature.toString("hex").slice(0, 64) + "...");
console.log("签名长度:", signature.length, "字节");

const verify = crypto.createVerify("SHA256");
verify.update(message);
verify.end();
const isValid = verify.verify(ecPair.publicKey, signature);

console.log("验签结果:", isValid ? "✅ 通过" : "❌ 失败");

// 篡改消息验证
console.log("\n  篡改消息后验签:");
const tamperedMsg = "区块链学习第 10 天：非对称加密（已篡改）";
const verify2 = crypto.createVerify("SHA256");
verify2.update(tamperedMsg);
verify2.end();
const isValid2 = verify2.verify(ecPair.publicKey, signature);
console.log("  验签结果:", isValid2 ? "✅ 通过（异常）" : "❌ 失败（符合预期）");

console.log("\n" + "=".repeat(60));
console.log("  结论：ECC 用 1/12 的密钥长度实现同等安全");
console.log("=".repeat(60));
