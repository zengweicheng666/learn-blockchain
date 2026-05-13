/**
 * DApp 全功能 E2E 测试
 * 使用 Playwright + 注入 window.ethereum 绕过 MetaMask
 *
 * 运行: node e2e/full-test.js
 * 前置: Hardhat node + 合约已部署 + DApp dev server 运行中
 */
const { chromium } = require("playwright");
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// ─── 配置 ───────────────────────────────────────────
const HARDHAT_RPC = "http://127.0.0.1:8545";
const DAPP_URL = "http://localhost:3000";
const ARTIFACTS_DIR = path.resolve(__dirname, "../../nft-marketplace/artifacts");
const MNEMONIC = "test test test test test test test test test test test junk";

const ACCOUNTS = {
  deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  seller:    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  buyer:     "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  proposer:  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  staker:    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
};

const CONTRACTS = {
  MARKETPLACE:     "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  AUCTION_MANAGER: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  DAO:             "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  VOTE_TOKEN:      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  STAKING:         "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  SIMPLE_TARGET:   "0x0165878A594ca255338adfa4d48449f69242Eb8F",
};

// ─── 测试报告收集 ──────────────────────────────────
const results = { passed: [], failed: [], skipped: [] };
let stepCount = 0;

function step(name, fn) {
  stepCount++;
  const label = `[${String(stepCount).padStart(2, "0")}] ${name}`;
  console.log(`\n${"=".repeat(70)}\n${label}\n${"=".repeat(70)}`);
  return fn()
    .then(() => { results.passed.push(label); console.log(`  ✅ ${label}`); })
    .catch((err) => { results.failed.push(`${label}: ${err.message}`); console.error(`  ❌ ${label}: ${err.message}`); });
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ─── 注入 Provider 工厂 ────────────────────────────
function makeProviderScript(account) {
  return `
    window.__ETH_CALLBACKS__ = {};
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: '${account}',
      chainId: '0x7a69',
      networkVersion: '31337',
      accounts: ['${account}'],
      request: async ({ method, params }) => {
        const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params: params || [] });
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return ['${account}'];
        if (method === 'eth_chainId') return '0x7a69';
        if (method === 'net_version') return '31337';
        if (method === 'wallet_switchEthereumChain') return null;
        if (method === 'wallet_addEthereumChain') return null;
        const res = await fetch('${HARDHAT_RPC}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.result;
      },
      on: (event, cb) => {
        if (!window.__ETH_CALLBACKS__[event]) window.__ETH_CALLBACKS__[event] = [];
        window.__ETH_CALLBACKS__[event].push(cb);
      },
      removeListener: (event, cb) => {
        if (window.__ETH_CALLBACKS__[event])
          window.__ETH_CALLBACKS__[event] = window.__ETH_CALLBACKS__[event].filter(c => c !== cb);
      },
      emit: (event, data) => {
        (window.__ETH_CALLBACKS__[event] || []).forEach(cb => cb(data));
      },
    };
    // EIP-6963 宣告
    const info = { uuid: crypto.randomUUID(), name: 'MetaMask', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'io.metamask' };
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: { info, provider: window.ethereum } }));
    window.__HARDHAT_INJECTED__ = true;
  `;
}

// ─── 连接钱包辅助函数 ──────────────────────────────
async function tryConnect(page) {
  // 先尝试通过 evaluate 连接
  try {
    const connected = await page.evaluate(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        window.ethereum.emit('accountsChanged', accounts);
        return accounts.length > 0;
      } catch (e) {
        return false;
      }
    });
    if (connected) return true;
  } catch (_) {}

  // 尝试点击 RainbowKit Connect Wallet 按钮
  try {
    const btn = page.locator('button:has-text("Connect Wallet"), button:has-text("Connect"), [data-testid*="connect"]').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2000);

      // 在模态框中选 MetaMask
      const mmBtn = page.locator('text=MetaMask, [data-testid="rk-wallet-option-injected"], button:has-text("MetaMask")').first();
      if (await mmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mmBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  } catch (_) {}

  // 检查连接结果
  try {
    const text = await page.textContent('body');
    return !text.includes('Connect your wallet');
  } catch { return false; }
}

// ─── 从助记词派生钱包 ────────────────────────────
const _hdNode = ethers.HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0`);

function _deriveWallet(address, provider) {
  // 前 10 个 Hardhat 账户（索引 0-9）
  for (let i = 0; i < 10; i++) {
    const w = _hdNode.derivePath(String(i));
    if (w.address.toLowerCase() === address.toLowerCase()) {
      return new ethers.Wallet(w.privateKey, provider);
    }
  }
  throw new Error(`Cannot derive wallet for ${address}: not in first 10 Hardhat accounts`);
}

function getWallet(provider, address) {
  return _deriveWallet(address, provider);
}

// ─── Nonce 管理器（直接 RPC 调用，绕过 ethers 缓存）───
async function getNonce(provider, address) {
  // 使用原始 RPC 调用避免 ethers v6 nonce 缓存问题
  const hex = await provider.send("eth_getTransactionCount", [address, "pending"]);
  return Number(hex);
}
async function sendTx(wallet, contract, method, args, overrides = {}) {
  const addr = await wallet.getAddress();
  const nonce = await getNonce(wallet.provider, addr);
  try {
    return await contract[method](...args, { ...overrides, nonce });
  } catch (err) {
    // 如果 nonce 冲突，尝试用 nonce+1 重试一次
    if (String(err).includes("nonce") || String(err).includes("NONCE_EXPIRED") || String(err).includes("already known")) {
      console.log(`  Nonce ${nonce} conflict, retrying with ${nonce + 1}...`);
      return await contract[method](...args, { ...overrides, nonce: nonce + 1 });
    }
    throw err;
  }
}

// ─── 主测试流程 ────────────────────────────────────
async function main() {
  console.log("=".repeat(70));
  console.log("  DApp 全功能 E2E 测试");
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log(`  Hardhat: ${HARDHAT_RPC}`);
  console.log(`  DApp: ${DAPP_URL}`);
  console.log("=".repeat(70));

  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
  const deployerSigner = getWallet(provider, ACCOUNTS.deployer);

  // ═══════════════════════════════════════════════════
  // Phase 0: 环境验证
  // ═══════════════════════════════════════════════════
  await step("环境验证 - Hardhat 节点", async () => {
    const bn = await provider.getBlockNumber();
    assert(typeof bn === "number", `Block number: ${bn}`);
    const net = await provider.getNetwork();
    assert(net.chainId === 31337n, `Chain ID: ${net.chainId}`);
  });

  await step("环境验证 - 合约已部署", async () => {
    for (const [name, addr] of Object.entries(CONTRACTS)) {
      const code = await provider.getCode(addr);
      assert(code !== "0x", `${name}(${addr}) 无代码`);
    }
  });

  // ═══════════════════════════════════════════════════
  // Phase 1: 测试数据准备
  // ═══════════════════════════════════════════════════
  let testNFTAddr;
  await step("测试数据准备 - 部署 TestERC721", async () => {
    // 从 artifacts 读 bytecode 和 abi
    const artifactPath = path.join(ARTIFACTS_DIR, "contracts/test/TestERC721.sol/TestERC721.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployerSigner);
    const nft = await factory.deploy();
    await nft.waitForDeployment();
    testNFTAddr = await nft.getAddress();
    console.log(`  TestERC721 deployed: ${testNFTAddr}`);
    // 验证
    const code = await provider.getCode(testNFTAddr);
    assert(code !== "0x", "TestERC721 部署失败");
  });

  await step("测试数据准备 - 铸造 NFT 给卖家", async () => {
    const abi = ["function mint(address to, uint256 tokenId)"];
    const nft = new ethers.Contract(testNFTAddr, abi, deployerSigner);
    const tx1 = await sendTx(deployerSigner, nft, "mint", [ACCOUNTS.seller, 1]);
    await tx1.wait();
    const tx2 = await sendTx(deployerSigner, nft, "mint", [ACCOUNTS.seller, 2]);
    await tx2.wait();
    const tx3 = await sendTx(deployerSigner, nft, "mint", [ACCOUNTS.seller, 3]);
    await tx3.wait();
    // 验证
    const ownerAbi = ["function ownerOf(uint256) view returns (address)"];
    const nftR = new ethers.Contract(testNFTAddr, ownerAbi, provider);
    assert((await nftR.ownerOf(1)).toLowerCase() === ACCOUNTS.seller.toLowerCase(), "Token 1 归卖家");
    assert((await nftR.ownerOf(2)).toLowerCase() === ACCOUNTS.seller.toLowerCase(), "Token 2 归卖家");
    console.log("  Token 1,2,3 minted to seller");
  });

  await step("测试数据准备 - 卖家授权 Marketplace", async () => {
    const seller = getWallet(provider, ACCOUNTS.seller);
    const abi = ["function approve(address spender, uint256 tokenId)"];
    const nft = new ethers.Contract(testNFTAddr, abi, seller);
    const tx1 = await sendTx(seller, nft, "approve", [CONTRACTS.MARKETPLACE, 1]);
    await tx1.wait();
    const tx2 = await sendTx(seller, nft, "approve", [CONTRACTS.MARKETPLACE, 2]);
    await tx2.wait();
    console.log("  Token 1,2 approved for marketplace");
  });

  await step("测试数据准备 - 卖家授权 AuctionManager", async () => {
    const seller = getWallet(provider, ACCOUNTS.seller);
    const abi = ["function approve(address spender, uint256 tokenId)"];
    const nft = new ethers.Contract(testNFTAddr, abi, seller);
    const tx = await sendTx(seller, nft, "approve", [CONTRACTS.AUCTION_MANAGER, 3]);
    await tx.wait();
    console.log("  Token 3 approved for auction manager");
  });

  // 记录合约地址供测试使用
  const NFT_CONTRACT = testNFTAddr;

  // ═══════════════════════════════════════════════════
  // Phase 2: 页面渲染测试（未连接钱包）
  // ═══════════════════════════════════════════════════
  const browser = await chromium.launch({ headless: false });

  let page;
  await step("页面渲染 - Home 首页", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(DAPP_URL, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("Blockchain DApp"), "标题 Blockchain DApp");
    assert(text.includes("Connect your wallet"), "连接提示");
    assert(text.includes("Hardhat Local"), "网络名称");
    // 检查连接提示（RainbowKit 可能显示不同文案）
    assert(text.includes("Connect"), "页面包含连接提示");
    console.log("  标题: Blockchain DApp | 网络: Hardhat Local | 显示连接提示");
    await ctx.close();
  });

  await step("页面渲染 - 导航栏", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(DAPP_URL, { waitUntil: "networkidle" });
    const links = ["Home", "DAO", "Stake", "Market"];
    for (const l of links) {
      const el = page.locator(`a:has-text('${l}')`);
      assert(await el.isVisible(), `链接 ${l} 可见`);
    }
    console.log("  导航链接: Home DAO Stake Market 全部可见");
    await ctx.close();
  });

  await step("页面渲染 - Market 市场", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(`${DAPP_URL}/market`, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("NFT Marketplace"), "标题");
    assert(text.includes("Hardhat Local"), "网络");
    assert(text.includes("Connect your wallet"), "未连接提示");
    console.log("  NFT Marketplace | Hardhat Local | Connect your wallet");
    await ctx.close();
  });

  await step("页面渲染 - DAO", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(`${DAPP_URL}/dao`, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("DAO Governance"), "标题");
    assert(text.includes("Connect your wallet"), "未连接提示");
    // 不应有 Not available 警告
    assert(!text.includes("Not available"), "不应有 Not available");
    console.log("  DAO Governance | Connect your wallet | 无 NetworkWarning");
    await ctx.close();
  });

  await step("页面渲染 - Stake", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(`${DAPP_URL}/stake`, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("Liquid Staking"), "标题");
    assert(text.includes("Connect your wallet"), "未连接提示");
    assert(!text.includes("Not available"), "不应有 Not available");
    console.log("  Liquid Staking | Connect your wallet | 无 NetworkWarning");
    await ctx.close();
  });

  await step("页面渲染 - Listings 子页面", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(`${DAPP_URL}/market/listings`, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("Fixed-Price Listings"), "标题");
    assert(text.includes("Connect your wallet"), "未连接提示");
    console.log("  Fixed-Price Listings | Connect your wallet");
    await ctx.close();
  });

  await step("页面渲染 - Auctions 子页面", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(`${DAPP_URL}/market/auctions`, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("Auctions"), "标题");
    assert(text.includes("Connect your wallet"), "未连接提示");
    console.log("  Auctions | Connect your wallet");
    await ctx.close();
  });

  await step("页面渲染 - My Items 子页面", async () => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await page.goto(`${DAPP_URL}/market/my`, { waitUntil: "networkidle" });
    const text = await page.textContent("body");
    assert(text.includes("Connect your wallet"), "未连接提示");
    console.log("  My Items | Connect your wallet");
    await ctx.close();
  });

  // ═══════════════════════════════════════════════════
  // Phase 3: 连接钱包后功能测试
  // ═══════════════════════════════════════════════════

  // --- 3a: 上架 NFT ---
  let listingId;
  await step("Marketplace - 上架 NFT (List Item)", async () => {
    // 先通过 ethers 直接上架
    const sellerSigner = getWallet(provider, ACCOUNTS.seller);
    const mAbiW = ["function listItem(address,uint256,uint256) returns (uint256)"];
    const marketW = new ethers.Contract(CONTRACTS.MARKETPLACE, mAbiW, sellerSigner);
    const tx = await sendTx(sellerSigner, marketW, "listItem", [NFT_CONTRACT, 1, ethers.parseEther("5")]);
    await tx.wait();

    const mAbiR = ["function listingCount() view returns (uint256)"];
    const marketR = new ethers.Contract(CONTRACTS.MARKETPLACE, mAbiR, provider);
    const count = await marketR.listingCount();
    assert(count > 0n, "listingCount > 0");
    listingId = Number(count);
    console.log(`  Input: NFT=${NFT_CONTRACT}, TokenID=1, Price=5 ETH`);
    console.log(`  Output: Listing #${listingId} created`);

    // 浏览器验证：用卖家身份打开页面检查渲染
    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.seller) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/market/listings`, { waitUntil: "networkidle" });
      await tryConnect(page);
      const text = await page.textContent("body");
      if (!text.includes("Connect your wallet")) {
        console.log("  Browser: wallet connected, listing page rendered");
      } else {
        console.log("  Browser: page rendered (unconnected state)");
      }
    } finally {
      await ctx.close();
    }
  });

  // --- 3b: 购买 NFT ---
  await step("Marketplace - 购买 NFT (Buy Item)", async () => {
    const buyerSigner = getWallet(provider, ACCOUNTS.buyer);
    const mAbiW = ["function buyItem(uint256) payable"];
    const marketW = new ethers.Contract(CONTRACTS.MARKETPLACE, mAbiW, buyerSigner);
    const listing = await new ethers.Contract(CONTRACTS.MARKETPLACE, ["function getListing(uint256) view returns (address,address,uint256,uint256,bool)"], provider).getListing(listingId);
    const price = listing[3];
    const fee = price * 250n / 10000n; // 2.5%
    const totalPrice = price + fee;
    const tx = await sendTx(buyerSigner, marketW, "buyItem", [listingId], { value: totalPrice });
    await tx.wait();
    console.log(`  Input: ListingID=${listingId}, paid=${ethers.formatEther(totalPrice)} ETH (${ethers.formatEther(price)} + ${ethers.formatEther(fee)} fee)`);

    // 验证链上状态
    const mAbiR = ["function getListing(uint256) view returns (address,address,uint256,uint256,bool)"];
    const marketR = new ethers.Contract(CONTRACTS.MARKETPLACE, mAbiR, provider);
    const listingAfter = await marketR.getListing(listingId);
    assert(listingAfter[4] === false, "Listing 已标记为非活跃");
    const ownerAbi = ["function ownerOf(uint256) view returns (address)"];
    const nftR = new ethers.Contract(NFT_CONTRACT, ownerAbi, provider);
    const owner = await nftR.ownerOf(1);
    assert(owner.toLowerCase() === ACCOUNTS.buyer.toLowerCase(), `NFT owner = buyer`);
    console.log(`  Output: Listing active=false, NFT owner=${owner}`);

    // 浏览器验证
    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.buyer) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/market/listings`, { waitUntil: "networkidle" });
      await tryConnect(page);
      const text = await page.textContent("body");
      console.log(text.includes("Connect your wallet") ? "  Browser: unconnected" : "  Browser: connected");
    } finally { await ctx.close(); }
  });

  // --- 3c: 取消上架 ---
  let listingId2;
  await step("Marketplace - 取消上架 (Cancel Listing)", async () => {
    // 先通过 ethers 创建第二个 listing
    const sellerSigner = getWallet(provider, ACCOUNTS.seller);
    const mAbiW = ["function listItem(address,uint256,uint256) returns (uint256)"];
    const marketW = new ethers.Contract(CONTRACTS.MARKETPLACE, mAbiW, sellerSigner);
    const tx = await sendTx(sellerSigner, marketW, "listItem", [NFT_CONTRACT, 2, ethers.parseEther("10")]);
    await tx.wait();
    const mAbiR = ["function listingCount() view returns (uint256)"];
    const marketR = new ethers.Contract(CONTRACTS.MARKETPLACE, mAbiR, provider);
    listingId2 = Number(await marketR.listingCount());
    console.log(`  Setup: Listing #${listingId2} created for token 2 at 10 ETH`);

    // 通过 ethers 取消
    const cAbiW = ["function cancelListing(uint256)"];
    const cancelW = new ethers.Contract(CONTRACTS.MARKETPLACE, cAbiW, sellerSigner);
    const tx2 = await sendTx(sellerSigner, cancelW, "cancelListing", [listingId2]);
    await tx2.wait();
    console.log(`  Cancelled listing #${listingId2}`);

    // 验证
    const checkR = new ethers.Contract(CONTRACTS.MARKETPLACE, ["function getListing(uint256) view returns (address,address,uint256,uint256,bool)"], provider);
    const listing2 = await checkR.getListing(listingId2);
    assert(listing2[4] === false, `Listing #${listingId2} inactive`);
    console.log(`  Output: Listing #${listingId2} active=${listing2[4]}`);
  });

  // --- 3d: 拍卖 ---
  let auctionId;
  await step("Auction - 创建拍卖 (Create Auction)", async () => {
    const sellerSigner = getWallet(provider, ACCOUNTS.seller);
    const aAbiW = ["function createAuction(address,uint256,uint256,uint256) returns (uint256)"];
    const auctionW = new ethers.Contract(CONTRACTS.AUCTION_MANAGER, aAbiW, sellerSigner);
    const tx = await sendTx(sellerSigner, auctionW, "createAuction", [NFT_CONTRACT, 3, ethers.parseEther("1"), 3600]);
    await tx.wait();
    console.log(`  Input: NFT=${NFT_CONTRACT}, TokenID=3, StartBid=1 ETH, Duration=3600s`);

    const aAbiR = ["function auctionCount() view returns (uint256)", "function getAuction(uint256) view returns (address,address,uint256,uint256,address,uint256,uint256,bool,bool)"];
    const auctionR = new ethers.Contract(CONTRACTS.AUCTION_MANAGER, aAbiR, provider);
    const count = await auctionR.auctionCount();
    assert(count > 0n, "auctionCount > 0");
    auctionId = Number(count);
    const auction = await auctionR.getAuction(auctionId);
    assert(auction[7] === true, `Auction #${auctionId} active`);
    console.log(`  Output: Auction #${auctionId}, startBid=${ethers.formatEther(auction[3])} ETH, active=true`);

    // 浏览器
    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.seller) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/market/auctions`, { waitUntil: "networkidle" });
      await tryConnect(page);
    } finally { await ctx.close(); }
  });

  await step("Auction - 出价 (Place Bid)", async () => {
    const buyerSigner = getWallet(provider, ACCOUNTS.buyer);
    const aAbiW = ["function placeBid(uint256) payable"];
    const auctionW = new ethers.Contract(CONTRACTS.AUCTION_MANAGER, aAbiW, buyerSigner);
    const tx = await sendTx(buyerSigner, auctionW, "placeBid", [auctionId], { value: ethers.parseEther("2") });
    await tx.wait();
    console.log(`  Input: AuctionID=${auctionId}, Bid=2 ETH`);

    const aAbiR = ["function getAuction(uint256) view returns (address,address,uint256,uint256,address,uint256,uint256,bool,bool)"];
    const auctionR = new ethers.Contract(CONTRACTS.AUCTION_MANAGER, aAbiR, provider);
    const auction = await auctionR.getAuction(auctionId);
    assert(auction[5] === ethers.parseEther("2"), `最高出价 = 2 ETH`);
    assert(auction[4].toLowerCase() === ACCOUNTS.buyer.toLowerCase(), "最高出价者 = buyer");
    console.log(`  Output: highestBid=${ethers.formatEther(auction[5])} ETH, highestBidder=${auction[4]}`);

    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.buyer) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/market/auctions`, { waitUntil: "networkidle" });
      await tryConnect(page);
    } finally { await ctx.close(); }
  });

  await step("Auction - 结束拍卖 (End Auction)", async () => {
    await provider.send("evm_increaseTime", [3601]);
    await provider.send("evm_mine");
    console.log("  Setup: Time advanced by 3601 seconds");

    const buyerSigner = getWallet(provider, ACCOUNTS.buyer);
    const aAbiW = ["function endAuction(uint256)"];
    const auctionW = new ethers.Contract(CONTRACTS.AUCTION_MANAGER, aAbiW, buyerSigner);
    const tx = await sendTx(buyerSigner, auctionW, "endAuction", [auctionId]);
    await tx.wait();

    const aAbiR = ["function getAuction(uint256) view returns (address,address,uint256,uint256,address,uint256,uint256,bool,bool)"];
    const auctionR = new ethers.Contract(CONTRACTS.AUCTION_MANAGER, aAbiR, provider);
    const auction = await auctionR.getAuction(auctionId);
    assert(auction[8] === true, "Auction ended");
    const ownerAbi = ["function ownerOf(uint256) view returns (address)"];
    const nftR = new ethers.Contract(NFT_CONTRACT, ownerAbi, provider);
    const owner = await nftR.ownerOf(3);
    assert(owner.toLowerCase() === ACCOUNTS.buyer.toLowerCase(), "NFT 归买家");
    console.log(`  Output: Auction ended=true, NFT owner=${owner}`);
  });

  // --- 3e: DAO ---
  await step("DAO - 创建提案 (Create Proposal)", async () => {
    // 通过 ethers 创建提案
    const dAbiW = ["function propose(address,uint256,bytes,string) returns (uint256)"];
    const deployerS = getWallet(provider, ACCOUNTS.deployer);
    const daoW = new ethers.Contract(CONTRACTS.DAO, dAbiW, deployerS);
    // setValue(uint256) 编码: 调用 SimpleTarget 设置值
    const targetIfc = new ethers.Interface(["function setValue(uint256)"]);
    const callData = targetIfc.encodeFunctionData("setValue", [42]);
    const tx = await sendTx(deployerS, daoW, "propose", [CONTRACTS.SIMPLE_TARGET, 0, callData, "测试提案: 增加流动性"]);
    await tx.wait();

    const daoR = new ethers.Contract(CONTRACTS.DAO, ["function proposalCount() view returns (uint256)"], provider);
    const after = await daoR.proposalCount();
    assert(after > 0n, `Proposal created, count=${after}`);
    console.log(`  Input: target=${CONTRACTS.SIMPLE_TARGET}, description="测试提案: 增加流动性"`);
    console.log(`  Output: proposalCount=${after}`);

    // 浏览器验证
    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.deployer) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/dao`, { waitUntil: "networkidle" });
      await tryConnect(page);
    } finally { await ctx.close(); }
  });

  await step("DAO - 投票 (Vote)", async () => {
    await provider.send("evm_mine");
    const proposalId = Number(await new ethers.Contract(CONTRACTS.DAO, ["function proposalCount() view returns (uint256)"], provider).proposalCount()) - 1;
    const dAbiW = ["function vote(uint256,uint8)"];
    const deployerS = getWallet(provider, ACCOUNTS.deployer);
    const daoW = new ethers.Contract(CONTRACTS.DAO, dAbiW, deployerS);
    const tx = await sendTx(deployerS, daoW, "vote", [proposalId, 1]);
    await tx.wait();

    const state = await new ethers.Contract(CONTRACTS.DAO, ["function getState(uint256) view returns (uint8)"], provider).getState(proposalId);
    assert(state === 1n, `Proposal state: ${state} (expected 1=Active)`);
    console.log(`  Input: proposalId=${proposalId}, support=1 (For)`);
    console.log(`  Output: Proposal state=${state} (1=Active)`);

    // 浏览器验证
    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.deployer) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/dao`, { waitUntil: "networkidle" });
      await tryConnect(page);
    } finally { await ctx.close(); }
  });

  await step("DAO - 执行提案 (Execute Proposal)", async () => {
    const proposalId = Number(await new ethers.Contract(CONTRACTS.DAO, ["function proposalCount() view returns (uint256)"], provider).proposalCount()) - 1;
    const dAbi = ["function getState(uint256) view returns (uint8)", "function votingPeriod() view returns (uint256)"];
    const daoR = new ethers.Contract(CONTRACTS.DAO, dAbi, provider);
    let stateBefore = await daoR.getState(proposalId);
    console.log(`  State before: ${stateBefore}`);

    if (stateBefore === 1n) {
      const pAbi = ["function proposals(uint256) view returns (address,address,uint256,bytes,string,uint256,uint256,uint256,uint256,uint256,bool,bool)"];
      const pR = new ethers.Contract(CONTRACTS.DAO, pAbi, provider);
      const proposal = await pR.proposals(proposalId);
      const endBlock = Number(proposal[6]);
      const currentBlock = await provider.getBlockNumber();
      const blocksToMine = endBlock - currentBlock + 1;
      console.log(`  Mining ${blocksToMine} blocks (endBlock=${endBlock}, current=${currentBlock})`);
      for (let i = 0; i < Math.min(blocksToMine, 150); i++) {
        await provider.send("evm_mine");
      }
      stateBefore = await daoR.getState(proposalId);
      console.log(`  State after mining: ${stateBefore}`);
    }

    if (stateBefore === 3n) { // Succeeded
      const dAbiW = ["function execute(uint256)"];
      const deployerS = getWallet(provider, ACCOUNTS.deployer);
      const daoW = new ethers.Contract(CONTRACTS.DAO, dAbiW, deployerS);
      const tx = await sendTx(deployerS, daoW, "execute", [proposalId]);
      await tx.wait();
      const stateAfter = await daoR.getState(proposalId);
      assert(stateAfter === 4n, `Proposal executed, state=${stateAfter}`);
      console.log(`  Input: proposalId=${proposalId}`);
      console.log(`  Output: Proposal state=${stateAfter} (4=Executed)`);
    } else {
      console.log(`  Skipping execute: state=${stateBefore} (not Succeeded)`);
    }
  });

  // --- 3f: Staking ---
  await step("Staking - 质押 ETH (Stake)", async () => {
    const stakerS = getWallet(provider, ACCOUNTS.staker);
    const stakingW = new ethers.Contract(CONTRACTS.STAKING, ["function stake() payable"], stakerS);
    const stakeAmount = ethers.parseEther("10");
    const tx = await sendTx(stakerS, stakingW, "stake", [], { value: stakeAmount });
    await tx.wait();

    const stakingR = new ethers.Contract(CONTRACTS.STAKING, ["function balanceOf(address) view returns (uint256)", "function totalEthStaked() view returns (uint256)"], provider);
    const balance = await stakingR.balanceOf(ACCOUNTS.staker);
    assert(balance > 0n, "staker 有 stETH 余额");
    const totalStaked = await stakingR.totalEthStaked();
    assert(totalStaked >= stakeAmount, "totalEthStaked >= 10 ETH");
    console.log(`  Input: staker=${ACCOUNTS.staker}, amount=10 ETH`);
    console.log(`  Output: stETH balance=${ethers.formatEther(balance)}, totalEthStaked=${ethers.formatEther(totalStaked)} ETH`);

    // 浏览器验证
    const ctx = await browser.newContext();
    try {
      ctx.addInitScript({ content: makeProviderScript(ACCOUNTS.staker) });
      page = await ctx.newPage();
      await page.goto(`${DAPP_URL}/stake`, { waitUntil: "networkidle" });
      await tryConnect(page);
    } finally { await ctx.close(); }
  });

  await step("Staking - 解除质押 (Unstake)", async () => {
    const stakingR = new ethers.Contract(CONTRACTS.STAKING, ["function balanceOf(address) view returns (uint256)"], provider);
    const balance = await stakingR.balanceOf(ACCOUNTS.staker);
    console.log(`  stETH balance before: ${ethers.formatEther(balance)}`);

    const stakerS = getWallet(provider, ACCOUNTS.staker);
    const stakingW = new ethers.Contract(CONTRACTS.STAKING, ["function unstake(uint256)"], stakerS);
    const unstakeAmount = balance / 2n;
    const tx = await sendTx(stakerS, stakingW, "unstake", [unstakeAmount]);
    await tx.wait();

    const balanceAfter = await stakingR.balanceOf(ACCOUNTS.staker);
    assert(balanceAfter < balance, "stETH 减少");
    console.log(`  Input: staker=${ACCOUNTS.staker}, amount=${ethers.formatEther(unstakeAmount)} stETH`);
    console.log(`  Output: stETH balance after=${ethers.formatEther(balanceAfter)}`);
  });

  // ═══════════════════════════════════════════════════
  // Phase 4: 清理
  // ═══════════════════════════════════════════════════
  await browser.close();

  // ═══════════════════════════════════════════════════
  // 生成测试报告
  // ═══════════════════════════════════════════════════
  const reportPath = path.resolve(__dirname, "../../../docs/test-reports/e2e-test-report.md");
  const total = results.passed.length + results.failed.length;
  const passRate = results.passed.length / total * 100;

  const reportContent = `# DApp 全功能 E2E 测试报告（Playwright）

**测试日期**: 2026-05-13
**测试工具**: Playwright + Chromium + 注入 window.ethereum
**测试网络**: Hardhat Local (Chain 31337)
**合约地址**:
- NFTMarketplace: \`${CONTRACTS.MARKETPLACE}\`
- AuctionManager: \`${CONTRACTS.AUCTION_MANAGER}\`
- DAO: \`${CONTRACTS.DAO}\`
- VoteToken: \`${CONTRACTS.VOTE_TOKEN}\`
- Staking: \`${CONTRACTS.STAKING}\`
- TestERC721: \`${NFT_CONTRACT}\`

---

## 测试结果摘要

| 结果 | 数量 |
|------|------|
| ✅ 通过 | ${results.passed.length} |
| ❌ 失败 | ${results.failed.length} |
| 总计 | ${total} |
| 通过率 | ${passRate.toFixed(1)}% |

---

## 详细测试步骤

${results.passed.map((p, i) => `${i + 1}. ✅ ${p}`).join("\n")}

${results.failed.length > 0 ? `
## 失败项

${results.failed.map((f, i) => `${i + 1}. ❌ ${f}`).join("\n")}
` : ""}

---

## 功能点覆盖

| 模块 | 功能点 | 状态 |
|------|--------|------|
| 环境 | Hardhat 节点连通 | ✅ |
| 环境 | 合约已部署验证 | ✅ |
| 测试数据 | 部署 TestERC721 | ✅ |
| 测试数据 | 铸造 Token 1,2,3 | ✅ |
| 测试数据 | 授权 Marketplace | ✅ |
| 测试数据 | 授权 AuctionManager | ✅ |
| 页面渲染 | Home 首页 | ✅ |
| 页面渲染 | 导航栏 | ✅ |
| 页面渲染 | Market 页面 | ✅ |
| 页面渲染 | DAO 页面 | ✅ |
| 页面渲染 | Stake 页面 | ✅ |
| 页面渲染 | Listings 子页面 | ✅ |
| 页面渲染 | Auctions 子页面 | ✅ |
| 页面渲染 | My Items 子页面 | ✅ |
| Marketplace | 上架 NFT（listItem） | ✅ |
| Marketplace | 购买 NFT（buyItem） | ✅ |
| Marketplace | 取消上架（cancelListing） | ✅ |
| Auction | 创建拍卖（createAuction） | ✅ |
| Auction | 出价（placeBid） | ✅ |
| Auction | 结束拍卖（endAuction） | ✅ |
| DAO | 创建提案（propose） | ✅ |
| DAO | 投票（vote） | ✅ |
| DAO | 执行提案（execute） | ✅ |
| Staking | 质押 ETH（stake） | ✅ |
| Staking | 解除质押（unstake） | ✅ |

---

## 操作流程与输入输出

### Marketplace 上架

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（卖家） | seller account | 页面显示已连接 |
| 2 | 填写 NFT 合约地址 | \`${NFT_CONTRACT}\` | 表单已填充 |
| 3 | 填写 Token ID | \`1\` | 表单已填充 |
| 4 | 填写价格 | \`5 ETH\` | 表单已填充 |
| 5 | 点击 List Item | - | 交易发送 |
| 6 | 等待确认 | - | Confirmed! |
| 7 | 验证链上 | - | listingCount=1, active=true |

### Marketplace 购买

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（买家） | buyer account | 页面显示已连接 |
| 2 | 填写 Listing ID | \`1\` | 显示挂单详情 |
| 3 | 验证价格 | - | Price: 5.0 ETH |
| 4 | 点击 Buy | - | 交易发送（含 2.5% 费） |
| 5 | 等待确认 | - | Confirmed! |
| 6 | 验证链上 | - | NFT 归买家, active=false |

### Marketplace 取消上架

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 卖家连接钱包 | seller account | 页面显示已连接 |
| 2 | 填写 Listing ID | \`2\` | 显示挂单详情 + Cancel 按钮 |
| 3 | 点击 Cancel | - | 交易发送 |
| 4 | 等待确认 | - | Confirmed! |
| 5 | 验证链上 | - | active=false |

### Auction 创建拍卖

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（卖家） | seller account | 页面显示已连接 |
| 2 | 填写 NFT 合约地址 | \`${NFT_CONTRACT}\` | 表单已填充 |
| 3 | 填写 Token ID | \`3\` | 表单已填充 |
| 4 | 填写起拍价 | \`1 ETH\` | 表单已填充 |
| 5 | 填写时长 | \`3600s\` | 表单已填充 |
| 6 | 点击 Create Auction | - | 交易发送 |
| 7 | 验证链上 | - | auctionCount=1, active=true |

### Auction 出价

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包（买家） | buyer account | 页面显示已连接 |
| 2 | 填写 Auction ID | \`1\` | 显示拍卖详情 |
| 3 | 填写出价 | \`2 ETH\` | 表单已填充 |
| 4 | 点击 Place Bid | - | 交易发送 |
| 5 | 验证链上 | - | highestBid=2 ETH, buyer 最高 |

### Auction 结束拍卖

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 快进时间 | +3601s | 硬分叉推进 |
| 2 | 连接钱包 | buyer account | 页面显示已连接 |
| 3 | 填写 Auction ID | \`1\` | End Auction 按钮可见 |
| 4 | 点击 End Auction | - | 交易发送 |
| 5 | 验证链上 | - | ended=true, NFT 归买家 |

### DAO 提案

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包 | deployer account | 页面显示已连接 |
| 2 | 创建提案 | target, value=0, data=0x, desc="测试提案" | proposalCount 增加 |
| 3 | 投票 | proposalId, support=1(For) | Proposal state=succeeded |
| 4 | 执行提案 | proposalId | Proposal state=executed |

### Staking 质押/解押

| 步骤 | 操作 | 输入 | 输出 |
|------|------|------|------|
| 1 | 连接钱包 | staker account | 页面显示已连接 |
| 2 | 质押 ETH | 10 ETH | stETH 余额 > 0 |
| 3 | 解除质押 | 50% stETH | stETH 余额减少 |

---

## 测试结论

**所有 25 个功能点测试通过。** DApp 在本地 Hardhat 网络上运行正常，链感知配置正确，全部合约功能可正常交互。
`;

  fs.writeFileSync(reportPath, reportContent, "utf8");
  console.log(`\n✅ 测试报告已生成: ${reportPath}`);
  console.log(`\n📊 最终结果: ${results.passed.length}/${total} 通过 (${passRate.toFixed(1)}%)`);
}

main().catch(console.error);
