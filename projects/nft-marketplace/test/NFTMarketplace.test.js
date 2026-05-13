const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("NFTMarketplace", function () {
  async function deployFixture() {
    const [owner, seller, buyer] = await ethers.getSigners();
    const TestNFT = await ethers.getContractFactory("TestERC721");
    const nft = await TestNFT.deploy();
    await nft.waitForDeployment();

    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    const market = await Marketplace.deploy(250); // 2.5%
    await market.waitForDeployment();

    await nft.mint(seller.address, 1);
    await nft.mint(seller.address, 2);

    return { market, nft, owner, seller, buyer };
  }

  describe("Listing", function () {
    it("should revert if price is 0", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(market.target, 1);
      await expect(
        market.connect(seller).listItem(nft.target, 1, 0)
      ).to.be.revertedWith("Price must be > 0");
    });

    it("should revert if not owner", async function () {
      const { market, nft, buyer } = await loadFixture(deployFixture);
      await expect(
        market.connect(buyer).listItem(nft.target, 1, ethers.parseEther("1"))
      ).to.be.revertedWith("Not owner");
    });

    it("should revert if not approved", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await expect(
        market.connect(seller).listItem(nft.target, 1, ethers.parseEther("1"))
      ).to.be.revertedWith("Not approved");
    });

    it("should list an NFT and transfer to contract", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(market.target, 1);
      const tx = await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));
      await expect(tx)
        .to.emit(market, "Listed")
        .withArgs(1, seller.address, nft.target, 1, ethers.parseEther("10"));
      expect(await nft.ownerOf(1)).to.equal(market.target);
    });

    it("should allow setApprovalForAll", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).setApprovalForAll(market.target, true);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("5"));
      expect(await nft.ownerOf(1)).to.equal(market.target);
    });

    it("should increment listing count", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).setApprovalForAll(market.target, true);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("1"));
      expect(await market.listingCount()).to.equal(1);
    });
  });

  describe("Buying", function () {
    async function listedFixture() {
      const base = await deployFixture();
      const { market, nft, seller } = base;
      await nft.connect(seller).approve(market.target, 1);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));
      return base;
    }

    it("should transfer NFT to buyer and ETH to seller", async function () {
      const { market, nft, seller, buyer } = await loadFixture(listedFixture);
      const price = ethers.parseEther("10");
      const fee = ethers.parseEther("0.25");
      const total = price + fee;

      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      const tx = await market.connect(buyer).buyItem(1, { value: total });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      expect(await nft.ownerOf(1)).to.equal(buyer.address);
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      // seller receives price - fee = 9.75 ETH
      expect(sellerBalAfter - sellerBalBefore).to.equal(price - fee);
    });

    it("should revert if insufficient payment", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await expect(
        market.connect(buyer).buyItem(1, { value: ethers.parseEther("5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("should revert if seller tries to buy own item", async function () {
      const { market, seller } = await loadFixture(listedFixture);
      await expect(
        market.connect(seller).buyItem(1, { value: ethers.parseEther("10.25") })
      ).to.be.revertedWith("Cannot buy own item");
    });

    it("should revert if listing not active", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await market.connect(buyer).buyItem(1, { value: ethers.parseEther("10.25") });
      await expect(
        market.connect(buyer).buyItem(1, { value: ethers.parseEther("10.25") })
      ).to.be.revertedWith("Not active");
    });

    it("should return excess payment", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      const buyerBalBefore = await ethers.provider.getBalance(buyer.address);
      const tx = await market.connect(buyer).buyItem(1, { value: ethers.parseEther("20") });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const buyerBalAfter = await ethers.provider.getBalance(buyer.address);

      // buyer paid 10.25, sent 20, should get 9.75 back
      // net cost to buyer = 20 - 9.75 = 10.25
      expect(buyerBalAfter + gasCost - buyerBalBefore).to.equal(ethers.parseEther("-10.25"));
    });
  });

  describe("Cancel", function () {
    async function listedFixture() {
      const base = await deployFixture();
      const { market, nft, seller } = base;
      await nft.connect(seller).approve(market.target, 1);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));
      return base;
    }

    it("should allow seller to cancel and return NFT", async function () {
      const { market, nft, seller } = await loadFixture(listedFixture);
      const tx = await market.connect(seller).cancelListing(1);
      await expect(tx).to.emit(market, "ListingCancelled").withArgs(1);
      expect(await nft.ownerOf(1)).to.equal(seller.address);
    });

    it("should reject cancel from non-seller", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await expect(
        market.connect(buyer).cancelListing(1)
      ).to.be.revertedWith("Not seller");
    });

    it("should reject cancel if already sold", async function () {
      const { market, nft, seller, buyer } = await loadFixture(listedFixture);
      await nft.connect(seller).approve(market.target, 2);
      await market.connect(seller).listItem(nft.target, 2, ethers.parseEther("1"));
      await market.connect(buyer).buyItem(1, { value: ethers.parseEther("10.25") });
      await expect(
        market.connect(seller).cancelListing(1)
      ).to.be.revertedWith("Not active");
    });
  });

  describe("Platform Fee", function () {
    it("should accumulate fee on buy", async function () {
      const { market, nft, seller, buyer } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(market.target, 1);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("100"));

      const feeBefore = await market.accumulatedFees();
      await market.connect(buyer).buyItem(1, { value: ethers.parseEther("102.5") });
      const feeAfter = await market.accumulatedFees();

      expect(feeAfter - feeBefore).to.equal(ethers.parseEther("2.5"));
    });

    it("should allow owner to withdraw accumulated fees", async function () {
      const { market, nft, seller, buyer, owner } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(market.target, 1);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("100"));
      await market.connect(buyer).buyItem(1, { value: ethers.parseEther("102.5") });

      const balBefore = await ethers.provider.getBalance(owner.address);
      const tx = await market.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balAfter = await ethers.provider.getBalance(owner.address);

      expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("2.5"));
    });

    it("should use updated fee rate", async function () {
      const { market, nft, seller, buyer, owner } = await loadFixture(deployFixture);
      await market.connect(owner).setPlatformFee(500); // 5%

      await nft.connect(seller).approve(market.target, 1);
      await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("100"));
      await market.connect(buyer).buyItem(1, { value: ethers.parseEther("105") });

      expect(await market.accumulatedFees()).to.equal(ethers.parseEther("5"));
    });
  });
});
