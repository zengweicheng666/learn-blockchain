const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("AuctionManager", function () {
  async function deployFixture() {
    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();
    const TestNFT = await ethers.getContractFactory("TestERC721");
    const nft = await TestNFT.deploy();
    await nft.waitForDeployment();

    const AuctionManager = await ethers.getContractFactory("AuctionManager");
    const auctionMgr = await AuctionManager.deploy(250);
    await auctionMgr.waitForDeployment();

    await nft.mint(seller.address, 1);

    return { auctionMgr, nft, owner, seller, bidder1, bidder2 };
  }

  async function auctionFixture() {
    const base = await deployFixture();
    const { auctionMgr, nft, seller } = base;
    await nft.connect(seller).approve(auctionMgr.target, 1);
    await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
    return base;
  }

  describe("Create Auction", function () {
    it("should revert if starting bid is 0", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await expect(
        auctionMgr.connect(seller).createAuction(nft.target, 1, 0, 86400)
      ).to.be.revertedWith("Starting bid must be > 0");
    });

    it("should revert if duration is 0", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await expect(
        auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 0)
      ).to.be.revertedWith("Duration must be > 0");
    });

    it("should revert if not approved", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await expect(
        auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400)
      ).to.be.revertedWith("Not approved");
    });

    it("should create auction and transfer NFT", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(auctionMgr.target, 1);
      const tx = await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      await expect(tx).to.emit(auctionMgr, "AuctionCreated");
      expect(await nft.ownerOf(1)).to.equal(auctionMgr.target);
    });
  });

  describe("Place Bid", function () {
    it("should place a valid bid", async function () {
      const { auctionMgr, bidder1 } = await loadFixture(auctionFixture);
      const tx = await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("2") });
      await expect(tx).to.emit(auctionMgr, "BidPlaced").withArgs(1, bidder1.address, ethers.parseEther("2"));
    });

    it("should revert if bid below starting price", async function () {
      const { auctionMgr, bidder1 } = await loadFixture(auctionFixture);
      await expect(
        auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Below starting bid");
    });

    it("should revert if seller bids", async function () {
      const { auctionMgr, seller } = await loadFixture(auctionFixture);
      await expect(
        auctionMgr.connect(seller).placeBid(1, { value: ethers.parseEther("2") })
      ).to.be.revertedWith("Seller cannot bid");
    });

    it("should reject bid lower than current highest", async function () {
      const { auctionMgr, bidder1, bidder2 } = await loadFixture(auctionFixture);
      await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("2") });
      await expect(
        auctionMgr.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.5") })
      ).to.be.revertedWith("Bid too low");
    });

    it("should track previous highest bidder for refund", async function () {
      const { auctionMgr, bidder1, bidder2 } = await loadFixture(auctionFixture);
      await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("2") });
      await auctionMgr.connect(bidder2).placeBid(1, { value: ethers.parseEther("3") });
      expect(await auctionMgr.getPendingReturn(1, bidder1.address)).to.equal(ethers.parseEther("2"));
    });
  });

  describe("Withdraw Bid", function () {
    it("should allow outbid bidder to withdraw", async function () {
      const { auctionMgr, nft, seller, bidder1, bidder2 } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("2") });
      await auctionMgr.connect(bidder2).placeBid(1, { value: ethers.parseEther("3") });

      const balBefore = await ethers.provider.getBalance(bidder1.address);
      const tx = await auctionMgr.connect(bidder1).withdrawBid(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(bidder1.address);
      expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("2"));
    });

    it("should reject withdraw if nothing to withdraw", async function () {
      const { auctionMgr, nft, seller, bidder1 } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      await expect(
        auctionMgr.connect(bidder1).withdrawBid(1)
      ).to.be.revertedWith("Nothing to withdraw");
    });
  });

  describe("End Auction", function () {
    async function auctionWithBidsFixture() {
      const base = await deployFixture();
      const { auctionMgr, nft, seller, bidder1 } = base;
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("5") });
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine");
      return base;
    }

    it("should end auction and transfer NFT to winner", async function () {
      const { auctionMgr, nft, bidder1 } = await loadFixture(auctionWithBidsFixture);
      const tx = await auctionMgr.connect(bidder1).endAuction(1);
      await expect(tx).to.emit(auctionMgr, "AuctionEnded");
      expect(await nft.ownerOf(1)).to.equal(bidder1.address);
    });

    it("should send ETH to seller minus fee", async function () {
      const { auctionMgr, nft, seller, bidder1 } = await loadFixture(auctionWithBidsFixture);
      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      await auctionMgr.connect(bidder1).endAuction(1);
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      // 5 ETH - 2.5% = 4.875 ETH
      expect(sellerBalAfter - sellerBalBefore).to.equal(ethers.parseEther("4.875"));
    });

    it("should revert if auction not ended", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      await expect(
        auctionMgr.connect(seller).endAuction(1)
      ).to.be.revertedWith("Auction not ended");
    });

    it("should return NFT to seller if no bids", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 1);
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine");
      await auctionMgr.connect(seller).endAuction(1);
      expect(await nft.ownerOf(1)).to.equal(seller.address);
    });
  });
});
