const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PlatformFee", function () {
  async function deployFixture() {
    const [owner, user1] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TestPlatformFee");
    const impl = await factory.deploy(250); // 2.5%
    await impl.waitForDeployment();
    return { impl, owner, user1 };
  }

  it("should set initial fee to 250 bps", async function () {
    const { impl } = await loadFixture(deployFixture);
    expect(await impl.platformFee()).to.equal(250);
  });

  it("should reject initial fee > MAX_FEE (1000)", async function () {
    const factory = await ethers.getContractFactory("TestPlatformFee");
    await expect(factory.deploy(1001)).to.be.revertedWith("Fee too high");
  });

  it("calculateFee: 100 ETH at 250 bps = 2.5 fee, 97.5 net", async function () {
    const { impl } = await loadFixture(deployFixture);
    const [fee, net] = await impl.calculateFee(ethers.parseEther("100"));
    expect(fee).to.equal(ethers.parseEther("2.5"));
    expect(net).to.equal(ethers.parseEther("97.5"));
  });

  it("calculateFee: 1 ETH at 0 bps = 0 fee, 1 net", async function () {
    const { impl } = await loadFixture(deployFixture);
    await impl.setPlatformFee(0);
    const [fee, net] = await impl.calculateFee(ethers.parseEther("1"));
    expect(fee).to.equal(0);
    expect(net).to.equal(ethers.parseEther("1"));
  });

  it("should allow owner to set fee up to MAX_FEE", async function () {
    const { impl } = await loadFixture(deployFixture);
    await impl.setPlatformFee(1000);
    expect(await impl.platformFee()).to.equal(1000);
  });

  it("should reject owner setting fee > MAX_FEE", async function () {
    const { impl } = await loadFixture(deployFixture);
    await expect(impl.setPlatformFee(1001)).to.be.revertedWith("Fee too high");
  });

  it("should reject non-owner setting fee", async function () {
    const { impl, user1 } = await loadFixture(deployFixture);
    await expect(impl.connect(user1).setPlatformFee(500))
      .to.be.revertedWithCustomError(impl, "OwnableUnauthorizedAccount");
  });

  it("should allow owner to withdraw accumulated fees", async function () {
    const { impl, owner } = await loadFixture(deployFixture);
    await owner.sendTransaction({ to: impl.target, value: ethers.parseEther("10") });
    await impl.addFees(ethers.parseEther("10"));

    const balBefore = await ethers.provider.getBalance(owner.address);
    const tx = await impl.connect(owner).withdrawFees();
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(owner.address);

    expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("10"));
  });

  it("should emit PlatformFeeUpdated event", async function () {
    const { impl } = await loadFixture(deployFixture);
    await expect(impl.setPlatformFee(500))
      .to.emit(impl, "PlatformFeeUpdated")
      .withArgs(250, 500);
  });

  it("should emit FeesWithdrawn event", async function () {
    const { impl, owner } = await loadFixture(deployFixture);
    await owner.sendTransaction({ to: impl.target, value: ethers.parseEther("1") });
    await impl.addFees(ethers.parseEther("1"));
    await expect(impl.connect(owner).withdrawFees())
      .to.emit(impl, "FeesWithdrawn")
      .withArgs(owner.address, ethers.parseEther("1"));
  });
});
