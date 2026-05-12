const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let nft, owner, whitelisted, buyer, addr3;

  beforeEach(async function () {
    [owner, whitelisted, buyer, addr3] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy(
      "MyNFT",
      "MNFT",
      "https://example.com/metadata/",
      owner.address
    );
  });

  // ── 基本功能 ──────────────────────────────────────────

  it("应该有正确的名称和符号", async function () {
    expect(await nft.name()).to.equal("MyNFT");
    expect(await nft.symbol()).to.equal("MNFT");
  });

  it("初始供应量为 0", async function () {
    expect(await nft.totalSupply()).to.equal(0);
  });

  // ── reserveMint ──────────────────────────────────────

  it("owner 可以预留铸造", async function () {
    await nft.reserveMint(owner.address, 3);
    expect(await nft.totalSupply()).to.equal(3);
    expect(await nft.ownerOf(1)).to.equal(owner.address);
    expect(await nft.ownerOf(3)).to.equal(owner.address);
  });

  it("非 owner 预留铸造应回滚", async function () {
    await expect(
      nft.connect(buyer).reserveMint(buyer.address, 1)
    ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
  });

  // ── 白名单铸造 ──────────────────────────────────────

  it("白名单地址可以 whitelistMint", async function () {
    await nft.addToWhitelist([whitelisted.address]);
    await nft.connect(whitelisted).whitelistMint();
    expect(await nft.ownerOf(1)).to.equal(whitelisted.address);
  });

  it("非白名单地址 whitelistMint 应回滚", async function () {
    await expect(
      nft.connect(buyer).whitelistMint()
    ).to.be.revertedWith("Not in whitelist");
  });

  it("白名单地址不能超过 MAX_PER_WALLET", async function () {
    await nft.addToWhitelist([whitelisted.address]);
    for (let i = 0; i < 5; i++) {
      await nft.connect(whitelisted).whitelistMint();
    }
    await expect(
      nft.connect(whitelisted).whitelistMint()
    ).to.be.revertedWith("Max per wallet reached");
  });

  // ── 公开销售 ──────────────────────────────────────────

  it("公开销售未开启时 publicSaleMint 应回滚", async function () {
    await expect(
      nft.connect(buyer).publicSaleMint({ value: ethers.parseEther("0.01") })
    ).to.be.revertedWith("Public sale not active");
  });

  it("开启公开销售后可正常 mint", async function () {
    await nft.togglePublicSale();
    await nft.connect(buyer).publicSaleMint({ value: ethers.parseEther("0.01") });
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("ETH 不足时 publicSaleMint 应回滚", async function () {
    await nft.togglePublicSale();
    await expect(
      nft.connect(buyer).publicSaleMint({ value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Insufficient ETH");
  });

  // ── 最大供应量 ──────────────────────────────────────

  it("超过 MAX_SUPPLY 应回滚", async function () {
    // 分批铸造以避免 gas 耗尽
    for (let i = 0; i < 100; i++) {
      await nft.reserveMint(owner.address, 100);
    }
    await expect(
      nft.reserveMint(owner.address, 1)
    ).to.be.revertedWith("Exceeds max supply");
  });

  // ── tokenURI ─────────────────────────────────────────

  it("tokenURI 返回正确的 URI", async function () {
    await nft.reserveMint(owner.address, 1);
    expect(await nft.tokenURI(1)).to.equal(
      "https://example.com/metadata/1.json"
    );
  });

  it("不存在的 tokenId 查询 URI 应回滚", async function () {
    await expect(
      nft.tokenURI(999)
    ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
  });

  // ── 提款 ─────────────────────────────────────────────

  it("owner 可以提取合约余额", async function () {
    await nft.togglePublicSale();
    await nft.connect(buyer).publicSaleMint({ value: ethers.parseEther("0.01") });

    const balanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await nft.withdraw();
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(owner.address);

    expect(balanceAfter + gasCost).to.be.closeTo(
      balanceBefore + ethers.parseEther("0.01"),
      ethers.parseEther("0.001")
    );
  });

  it("非 owner 提款应回滚", async function () {
    await expect(
      nft.connect(buyer).withdraw()
    ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
  });
});
