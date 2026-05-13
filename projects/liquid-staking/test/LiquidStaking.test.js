const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LiquidStaking", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const LiquidStaking = await ethers.getContractFactory("LiquidStaking");
    const ls = await LiquidStaking.deploy(owner.address);
    await ls.waitForDeployment();
    return { ls, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      const { ls } = await loadFixture(deployFixture);
      expect(await ls.name()).to.equal("Staked ETH");
      expect(await ls.symbol()).to.equal("stETH");
    });

    it("should set the owner", async function () {
      const { ls, owner } = await loadFixture(deployFixture);
      expect(await ls.owner()).to.equal(owner.address);
    });

    it("should set initial APR to 500 bps (5%)", async function () {
      const { ls } = await loadFixture(deployFixture);
      expect(await ls.apr()).to.equal(500);
    });

    it("should set initial exchange rate to 1", async function () {
      const { ls } = await loadFixture(deployFixture);
      expect(await ls.getExchangeRate()).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Staking", function () {
    it("should revert if staking 0 ETH", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      await expect(
        ls.connect(user1).stake({ value: 0 })
      ).to.be.revertedWith("Zero deposit");
    });

    it("should mint stETH 1:1 for the first deposit", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("10");

      await ls.connect(user1).stake({ value: amount });

      expect(await ls.balanceOf(user1.address)).to.equal(amount);
      expect(await ls.totalEthStaked()).to.equal(amount);
    });

    it("should track totalSupply correctly", async function () {
      const { ls, user1, user2 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("5") });
      await ls.connect(user2).stake({ value: ethers.parseEther("3") });

      expect(await ls.totalSupply()).to.equal(ethers.parseEther("8"));
    });

    it("should adjust exchange rate after yield", async function () {
      const { ls, owner, user1 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("100") });

      // Fast forward 1 year
      await ethers.provider.send("evm_increaseTime", [365 * 86400]);
      await ethers.provider.send("evm_mine");

      // Accrue 5% yield
      await ls.connect(owner).accrueYield();

      // Exchange rate should now be > 1
      const rate = await ls.getExchangeRate();
      expect(rate).to.be.gt(ethers.parseEther("1"));
    });

    it("should mint fewer stETH when rate > 1", async function () {
      const { ls, owner, user1, user2 } = await loadFixture(deployFixture);

      // user1 stakes first
      await ls.connect(user1).stake({ value: ethers.parseEther("100") });

      // Accrue yield
      await ethers.provider.send("evm_increaseTime", [365 * 86400]);
      await ethers.provider.send("evm_mine");
      await ls.connect(owner).accrueYield();

      // user2 stakes after yield accrued (rate > 1)
      const user2Stake = ethers.parseEther("10");
      await ls.connect(user2).stake({ value: user2Stake });

      // user2 should get less stETH than 10
      const user2Balance = await ls.balanceOf(user2.address);
      expect(user2Balance).to.be.lt(user2Stake);
    });

    it("should emit Staked event", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1");

      await expect(ls.connect(user1).stake({ value: amount }))
        .to.emit(ls, "Staked")
        .withArgs(user1.address, amount, amount);
    });
  });

  describe("Unstaking", function () {
    it("should revert if unstaking 0", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      await expect(ls.connect(user1).unstake(0)).to.be.revertedWith("Zero amount");
    });

    it("should revert if insufficient balance", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      await expect(ls.connect(user1).unstake(1)).to.be.revertedWith("Insufficient stETH");
    });

    it("should burn stETH and return ETH", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      const deposit = ethers.parseEther("10");
      const withdraw = ethers.parseEther("5");

      await ls.connect(user1).stake({ value: deposit });

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await ls.connect(user1).unstake(withdraw);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      // Check stETH burned
      expect(await ls.balanceOf(user1.address)).to.equal(withdraw); // 10 - 5 = 5

      // Check ETH returned (balance after + gas ≈ balance before + 5)
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter + gasCost - balanceBefore).to.equal(withdraw);

      // Check totalEthStaked decreased
      expect(await ls.totalEthStaked()).to.equal(withdraw);
    });

    it("should emit Unstaked event", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1");

      await ls.connect(user1).stake({ value: amount });

      await expect(ls.connect(user1).unstake(amount))
        .to.emit(ls, "Unstaked")
        .withArgs(user1.address, amount, amount);
    });

    it("should return more ETH after yield accrual", async function () {
      const { ls, owner, user1 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("100") });

      // Fast forward 1 year and accrue yield
      await ethers.provider.send("evm_increaseTime", [365 * 86400]);
      await ethers.provider.send("evm_mine");
      await ls.connect(owner).accrueYield();

      // Yield is virtual (totalEthStaked increased but no actual ETH deposited)
      // Fund the contract with extra ETH to cover the yield withdrawal
      await owner.sendTransaction({
        to: ls.target,
        value: ethers.parseEther("10"),
      });

      // Unstake all
      const balance = await ls.balanceOf(user1.address);

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await ls.connect(user1).unstake(balance);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const ethReturned = balanceAfter + gasCost - balanceBefore;

      expect(ethReturned).to.be.gt(ethers.parseEther("100"));
    });
  });

  describe("Yield", function () {
    it("should not accrue yield if no time has passed", async function () {
      const { ls, owner } = await loadFixture(deployFixture);
      await expect(ls.connect(owner).accrueYield()).to.not.emit(ls, "YieldAccrued");
    });

    it("should accrue yield based on APR and time", async function () {
      const { ls, owner, user1 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("100") });

      // Fast forward 1 year
      await ethers.provider.send("evm_increaseTime", [365 * 86400]);
      await ethers.provider.send("evm_mine");

      await ls.connect(owner).accrueYield();

      // 5% of 100 = 5 (allow tiny rounding from timestamp drift)
      expect(await ls.totalEthStaked()).to.be.closeTo(
        ethers.parseEther("105"),
        ethers.parseEther("0.001")
      );
    });

    it("should accrue proportional yield for partial year", async function () {
      const { ls, owner, user1 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("100") });

      // Fast forward half a year
      await ethers.provider.send("evm_increaseTime", [183 * 86400]);
      await ethers.provider.send("evm_mine");

      await ls.connect(owner).accrueYield();

      // ~2.5% of 100 = ~2.5
      const total = await ls.totalEthStaked();
      expect(total).to.be.closeTo(
        ethers.parseEther("102.5"),
        ethers.parseEther("0.01")
      );
    });

    it("should emit YieldAccrued event", async function () {
      const { ls, owner, user1 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("100") });

      await ethers.provider.send("evm_increaseTime", [365 * 86400]);
      await ethers.provider.send("evm_mine");

      const tx = await ls.connect(owner).accrueYield();

      // Verify event was emitted with correct structure
      await expect(tx).to.emit(ls, "YieldAccrued");

      // Verify state updated correctly
      expect(await ls.totalEthStaked()).to.be.closeTo(
        ethers.parseEther("105"),
        ethers.parseEther("0.001")
      );
    });
  });

  describe("APR Management", function () {
    it("should allow owner to set APR", async function () {
      const { ls, owner } = await loadFixture(deployFixture);
      await ls.connect(owner).setApr(1000);
      expect(await ls.apr()).to.equal(1000);
    });

    it("should not allow non-owner to set APR", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      await expect(ls.connect(user1).setApr(1000)).to.be.revertedWithCustomError(
        ls,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("receive()", function () {
    it("should stake on direct ETH transfer", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("2");

      await expect(
        user1.sendTransaction({ to: ls.target, value: amount })
      ).to.changeTokenBalance(ls, user1, amount);
    });
  });

  describe("Edge cases", function () {
    it("should handle multiple stake and unstake cycles", async function () {
      const { ls, user1 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("10") });
      await ls.connect(user1).stake({ value: ethers.parseEther("5") });

      expect(await ls.balanceOf(user1.address)).to.equal(ethers.parseEther("15"));

      await ls.connect(user1).unstake(ethers.parseEther("3"));
      await ls.connect(user1).unstake(ethers.parseEther("12"));

      expect(await ls.balanceOf(user1.address)).to.equal(0);
    });

    it("should handle multiple users", async function () {
      const { ls, user1, user2 } = await loadFixture(deployFixture);

      await ls.connect(user1).stake({ value: ethers.parseEther("10") });
      await ls.connect(user2).stake({ value: ethers.parseEther("20") });

      expect(await ls.totalSupply()).to.equal(ethers.parseEther("30"));
      expect(await ls.totalEthStaked()).to.equal(ethers.parseEther("30"));
    });
  });
});
