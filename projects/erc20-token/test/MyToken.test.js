const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy("MyToken", "MTK", owner.address);
  });

  it("应该有正确的名称和符号", async function () {
    expect(await token.name()).to.equal("MyToken");
    expect(await token.symbol()).to.equal("MTK");
  });

  it("owner 可以铸造代币", async function () {
    await token.mint(addr1.address, 1000);
    expect(await token.balanceOf(addr1.address)).to.equal(1000);
  });

  it("非 owner 铸造应回滚", async function () {
    await expect(
      token.connect(addr1).mint(addr1.address, 1000)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });

  it("持币者可以销毁自己的代币", async function () {
    await token.mint(addr1.address, 1000);
    await token.connect(addr1).burn(500);
    expect(await token.balanceOf(addr1.address)).to.equal(500);
  });

  it("销毁超过余额应回滚", async function () {
    await token.mint(addr1.address, 100);
    await expect(
      token.connect(addr1).burn(200)
    ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
  });

  it("标准转账流程可用", async function () {
    await token.mint(owner.address, 1000);
    await token.transfer(addr1.address, 500);
    expect(await token.balanceOf(addr1.address)).to.equal(500);
    expect(await token.balanceOf(owner.address)).to.equal(500);
  });

  it("approve + transferFrom 流程可用", async function () {
    await token.mint(owner.address, 1000);
    await token.approve(addr1.address, 300);
    await token.connect(addr1).transferFrom(owner.address, addr2.address, 300);
    expect(await token.balanceOf(addr2.address)).to.equal(300);
    expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
  });

  it("直接篡改存储槽后 balanceOf 与 totalSupply 不一致", async function () {
    await token.mint(addr1.address, 1000);
    expect(await token.balanceOf(addr1.address)).to.equal(1000);
    expect(await token.totalSupply()).to.equal(1000);

    // ERC20._balances mapping 在 slot 0
    // mapping(key, slot) 的存储位置 = keccak256(abi.encode(key, slot))
    const slot = ethers.toBeHex(0, 32);
    const key = ethers.toBeHex(addr1.address, 32);
    const storageSlot = ethers.keccak256(key + slot.slice(2));

    // 通过 hardhat_setStorageAt 直接修改 EVM 存储
    await ethers.provider.send("hardhat_setStorageAt", [
      await token.getAddress(),
      storageSlot,
      ethers.toBeHex("0x" + (9999n).toString(16), 32),
    ]);

    // balanceOf 被篡改为 9999
    expect(await token.balanceOf(addr1.address)).to.equal(9999);
    // 但 totalSupply 仍然是 1000，链上状态不一致！
    expect(await token.totalSupply()).to.equal(1000);
  });
});
