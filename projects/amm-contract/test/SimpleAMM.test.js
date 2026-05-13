const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleAMM", function () {
  let tokenA, tokenB, amm, lp, user1, user2;
  const DECIMALS = 18;
  const INITIAL_MINT = ethers.parseEther("100000");
  const LIQ_A = ethers.parseEther("100");
  const LIQ_B = ethers.parseEther("10000");

  beforeEach(async function () {
    [lp, user1, user2] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    tokenA = await TestToken.deploy("TokenA", "TKA", DECIMALS);
    tokenB = await TestToken.deploy("TokenB", "TKB", DECIMALS);

    await tokenA.mint(lp.address, INITIAL_MINT);
    await tokenB.mint(lp.address, INITIAL_MINT);
    await tokenA.mint(user1.address, INITIAL_MINT);
    await tokenB.mint(user1.address, INITIAL_MINT);

    const SimpleAMM = await ethers.getContractFactory("SimpleAMM");
    amm = await SimpleAMM.deploy(await tokenA.getAddress(), await tokenB.getAddress());
  });

  async function approveBoth(signer, ammAddr) {
    const MAX = ethers.MaxUint256;
    await tokenA.connect(signer).approve(ammAddr, MAX);
    await tokenB.connect(signer).approve(ammAddr, MAX);
  }

  async function addLiquidity(amountA, amountB, signer) {
    signer = signer || lp;
    const ammAddr = await amm.getAddress();
    await approveBoth(signer, ammAddr);
    return amm.connect(signer).addLiquidity(amountA, amountB);
  }

  // ── 添加流动性 ──────────────────────────────────────

  describe("addLiquidity()", function () {
    it("首次添加流动性成功", async function () {
      const tx = await addLiquidity(LIQ_A, LIQ_B);
      await expect(tx).to.emit(amm, "LiquidityAdded");

      expect(await amm.balanceOf(lp.address)).to.be.gt(0);
      expect(await amm.reserveA()).to.equal(LIQ_A);
      expect(await amm.reserveB()).to.equal(LIQ_B);
    });

    it("LP 代币总量 = sqrt(amountA * amountB)", async function () {
      await addLiquidity(LIQ_A, LIQ_B);
      const expected = BigInt(Math.round(Math.sqrt(Number(LIQ_A) * Number(LIQ_B))));
      expect(await amm.totalSupply()).to.be.closeTo(expected, 1n);
    });

    it("后续添加按比例计算", async function () {
      await addLiquidity(LIQ_A, LIQ_B);

      await tokenA.mint(lp.address, LIQ_A / 2n);
      await tokenB.mint(lp.address, LIQ_B / 2n);
      await addLiquidity(LIQ_A / 2n, LIQ_B / 2n);

      expect(await amm.reserveA()).to.equal(LIQ_A + LIQ_A / 2n);
      expect(await amm.reserveB()).to.equal(LIQ_B + LIQ_B / 2n);
    });

    it("非比例添加时自动调整为最优比例", async function () {
      await addLiquidity(LIQ_A, LIQ_B);

      await tokenA.mint(lp.address, ethers.parseEther("50"));
      await tokenB.mint(lp.address, ethers.parseEther("5000"));

      // 尝试加 50A + 5000B（B 足够按比例匹配）
      await addLiquidity(ethers.parseEther("50"), ethers.parseEther("5000"));

      // A 增加 50，B 应增加 5000
      expect(await amm.reserveA()).to.equal(LIQ_A + ethers.parseEther("50"));
      expect(await amm.reserveB()).to.equal(LIQ_B + ethers.parseEther("5000"));
    });

    it("铸造 0 份额应回滚", async function () {
      await addLiquidity(LIQ_A, LIQ_B);
      await expect(
        addLiquidity(1, 1)
      ).to.be.revertedWith("Zero shares minted");
    });
  });

  // ── 移除流动性 ──────────────────────────────────────

  describe("removeLiquidity()", function () {
    beforeEach(async function () {
      await addLiquidity(LIQ_A, LIQ_B);
    });

    it("移除全部流动性", async function () {
      const shares = await amm.balanceOf(lp.address);
      await expect(amm.connect(lp).removeLiquidity(shares))
        .to.emit(amm, "LiquidityRemoved");

      expect(await amm.reserveA()).to.equal(0);
      expect(await amm.reserveB()).to.equal(0);
      expect(await amm.balanceOf(lp.address)).to.equal(0);
    });

    it("移除部分流动性", async function () {
      const shares = await amm.balanceOf(lp.address);
      const half = shares / 2n;

      const balA = await tokenA.balanceOf(lp.address);
      const balB = await tokenB.balanceOf(lp.address);

      await amm.connect(lp).removeLiquidity(half);

      expect(await tokenA.balanceOf(lp.address)).to.be.gt(balA);
      expect(await tokenB.balanceOf(lp.address)).to.be.gt(balB);
    });

    it("0 份额应回滚", async function () {
      await expect(
        amm.connect(lp).removeLiquidity(0)
      ).to.be.revertedWith("Zero shares");
    });

    it("LP 余额不足应回滚", async function () {
      await expect(
        amm.connect(user1).removeLiquidity(1)
      ).to.be.revertedWith("Insufficient LP balance");
    });
  });

  // ── 兑换 ────────────────────────────────────────────

  describe("swap()", function () {
    beforeEach(async function () {
      await addLiquidity(LIQ_A, LIQ_B);
    });

    it("TokenA → TokenB 兑换成功", async function () {
      const amountIn = ethers.parseEther("1");
      const amountOut = await amm.getAmountOut(await tokenA.getAddress(), amountIn);

      await approveBoth(user1, await amm.getAddress());
      await expect(
        amm.connect(user1).swap(await tokenA.getAddress(), amountIn, 0)
      ).to.emit(amm, "Swapped");

      expect(amountOut).to.be.gt(0);
      expect(amountOut).to.be.lt(ethers.parseEther("100"));
    });

    it("TokenB → TokenA 兑换成功", async function () {
      const amountIn = ethers.parseEther("100");
      await approveBoth(user1, await amm.getAddress());

      await expect(
        amm.connect(user1).swap(await tokenB.getAddress(), amountIn, 0)
      ).to.emit(amm, "Swapped");
    });

    it("滑点保护：低于最小输出应回滚", async function () {
      const amountIn = ethers.parseEther("1");
      const amountOut = await amm.getAmountOut(await tokenA.getAddress(), amountIn);

      await approveBoth(user1, await amm.getAddress());
      await expect(
        amm.connect(user1).swap(await tokenA.getAddress(), amountIn, amountOut + 1n)
      ).to.be.revertedWith("Insufficient output");
    });

    it("k 恒定乘积在兑换后仍然有效", async function () {
      const kBefore = (await amm.reserveA()) * (await amm.reserveB());

      const amountIn = ethers.parseEther("1");
      await approveBoth(user1, await amm.getAddress());
      await amm.connect(user1).swap(await tokenA.getAddress(), amountIn, 0);

      const kAfter = (await amm.reserveA()) * (await amm.reserveB());
      expect(kAfter).to.be.gte(kBefore);
    });

    it("无效代币应回滚", async function () {
      await expect(
        amm.connect(user1).swap(ethers.ZeroAddress, 1, 0)
      ).to.be.revertedWith("Invalid token");
    });

    it("零金额应回滚", async function () {
      await expect(
        amm.connect(user1).swap(await tokenA.getAddress(), 0, 0)
      ).to.be.revertedWith("Zero amount");
    });
  });

  // ── 集成 ────────────────────────────────────────────

  it("完整流程：添加 → 兑换 → 移除", async function () {
    await addLiquidity(LIQ_A, LIQ_B);

    const amountIn = ethers.parseEther("5");
    await approveBoth(user1, await amm.getAddress());
    await amm.connect(user1).swap(await tokenA.getAddress(), amountIn, 0);

    const shares = await amm.balanceOf(lp.address);
    await amm.connect(lp).removeLiquidity(shares);

    expect(await tokenA.balanceOf(lp.address)).to.be.gt(0);
    expect(await tokenB.balanceOf(lp.address)).to.be.gt(0);
  });

  it("多 LP 添加流动性", async function () {
    await addLiquidity(LIQ_A, LIQ_B);

    const userA = LIQ_A / 2n;
    const userB = LIQ_B / 2n;
    await tokenA.mint(user1.address, userA);
    await tokenB.mint(user1.address, userB);
    await addLiquidity(userA, userB, user1);

    expect(await amm.reserveA()).to.equal(LIQ_A + userA);
    expect(await amm.reserveB()).to.equal(LIQ_B + userB);
    expect(await amm.balanceOf(lp.address)).to.be.gt(0);
    expect(await amm.balanceOf(user1.address)).to.be.gt(0);
  });
});
