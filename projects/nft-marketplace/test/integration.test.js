const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Integration", function () {
  async function fullFixture() {
    const [owner, seller, buyer1, buyer2] = await ethers.getSigners();

    const TestNFT = await ethers.getContractFactory("TestERC721");
    const nft = await TestNFT.deploy();
    await nft.waitForDeployment();

    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    const market = await Marketplace.deploy(250);
    await market.waitForDeployment();

    const AuctionManager = await ethers.getContractFactory("AuctionManager");
    const auctionMgr = await AuctionManager.deploy(250);
    await auctionMgr.waitForDeployment();

    return { market, auctionMgr, nft, owner, seller, buyer1, buyer2 };
  }

  it("full flow: mint -> approve -> list -> buy", async function () {
    const { market, nft, seller, buyer1 } = await loadFixture(fullFixture);

    await nft.mint(seller.address, 1);
    await nft.connect(seller).setApprovalForAll(market.target, true);
    await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));

    const sellerBalBefore = await ethers.provider.getBalance(seller.address);
    await market.connect(buyer1).buyItem(1, { value: ethers.parseEther("10.25") });
    const sellerBalAfter = await ethers.provider.getBalance(seller.address);

    expect(await nft.ownerOf(1)).to.equal(buyer1.address);
    expect(sellerBalAfter - sellerBalBefore).to.equal(ethers.parseEther("9.75"));
  });

  it("full flow: mint -> approve -> auction -> bid -> end", async function () {
    const { auctionMgr, nft, seller, buyer1 } = await loadFixture(fullFixture);

    await nft.mint(seller.address, 2);
    await nft.connect(seller).setApprovalForAll(auctionMgr.target, true);
    await auctionMgr.connect(seller).createAuction(nft.target, 2, ethers.parseEther("1"), 86400);
    await auctionMgr.connect(buyer1).placeBid(1, { value: ethers.parseEther("5") });

    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");

    await auctionMgr.connect(buyer1).endAuction(1);

    expect(await nft.ownerOf(2)).to.equal(buyer1.address);
    expect(await auctionMgr.accumulatedFees()).to.equal(ethers.parseEther("0.125"));
  });

  it("multiple users competing in auction", async function () {
    const { auctionMgr, nft, seller, buyer1, buyer2 } = await loadFixture(fullFixture);

    await nft.mint(seller.address, 3);
    await nft.connect(seller).setApprovalForAll(auctionMgr.target, true);
    await auctionMgr.connect(seller).createAuction(nft.target, 3, ethers.parseEther("1"), 86400);

    await auctionMgr.connect(buyer1).placeBid(1, { value: ethers.parseEther("2") });
    await auctionMgr.connect(buyer2).placeBid(1, { value: ethers.parseEther("5") });

    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");

    // Outbid buyer1 withdraws
    const balBefore = await ethers.provider.getBalance(buyer1.address);
    const tx = await auctionMgr.connect(buyer1).withdrawBid(1);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(buyer1.address);
    expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("2"));

    await auctionMgr.connect(buyer2).endAuction(1);
    expect(await nft.ownerOf(3)).to.equal(buyer2.address);
  });
});
