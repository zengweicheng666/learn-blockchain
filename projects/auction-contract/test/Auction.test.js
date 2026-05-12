const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
  let nft, auction, seller, bidder1, bidder2, bidder3;
  const STARTING_BID = ethers.parseEther("0.1");
  const DURATION = 60 * 60 * 24; // 1 天

  beforeEach(async function () {
    [seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const TestNFT = await ethers.getContractFactory("TestNFT");
    nft = await TestNFT.deploy();

    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy(
      await nft.getAddress(),
      1, // tokenId
      STARTING_BID,
      DURATION
    );

    // 铸造 NFT 给卖家并授权拍卖合约
    await nft.mint(seller.address);
    await nft.connect(seller).approve(await auction.getAddress(), 1);
  });

  // ── 启动 ──────────────────────────────────────────────

  describe("start()", function () {
    it("卖家可以启动拍卖", async function () {
      await auction.connect(seller).start();
      expect(await auction.started()).to.equal(true);
      expect(await nft.ownerOf(1)).to.equal(await auction.getAddress());
    });

    it("非卖家启动应回滚", async function () {
      await expect(
        auction.connect(bidder1).start()
      ).to.be.revertedWith("Not seller");
    });

    it("重复启动应回滚", async function () {
      await auction.connect(seller).start();
      await expect(
        auction.connect(seller).start()
      ).to.be.revertedWith("Already started");
    });

    it("卖家未授权时启动应回滚", async function () {
      const Auction = await ethers.getContractFactory("Auction");
      const auction2 = await Auction.deploy(
        await nft.getAddress(),
        2,
        STARTING_BID,
        DURATION
      );
      // tokenId 2 不存在，所以会失败
      await expect(
        auction2.connect(seller).start()
      ).to.be.reverted;
    });
  });

  // ── 出价 ──────────────────────────────────────────────

  describe("bid()", function () {
    beforeEach(async function () {
      await auction.connect(seller).start();
    });

    it("正常出价成功", async function () {
      await auction.connect(bidder1).bid({ value: STARTING_BID });
      expect(await auction.highestBidder()).to.equal(bidder1.address);
      expect(await auction.highestBid()).to.equal(STARTING_BID);
    });

    it("出价低于起拍价应回滚", async function () {
      await expect(
        auction.connect(bidder1).bid({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Below starting bid");
    });

    it("出价未超过当前最高价应回滚", async function () {
      await auction.connect(bidder1).bid({ value: STARTING_BID });
      await expect(
        auction.connect(bidder2).bid({ value: STARTING_BID })
      ).to.be.revertedWith("Bid too low");
    });

    it("卖家不能出价", async function () {
      await expect(
        auction.connect(seller).bid({ value: STARTING_BID })
      ).to.be.revertedWith("Seller cannot bid");
    });

    it("拍卖结束后不能出价", async function () {
      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await expect(
        auction.connect(bidder1).bid({ value: STARTING_BID })
      ).to.be.revertedWith("Auction ended");
    });

    it("结算后不能出价", async function () {
      await auction.connect(bidder1).bid({ value: STARTING_BID });
      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await auction.connect(seller).auctionEnd();
      await expect(
        auction.connect(bidder2).bid({ value: ethers.parseEther("0.2") })
      ).to.be.revertedWith("Auction ended");
    });
  });

  // ── 退款 ──────────────────────────────────────────────

  describe("withdraw()", function () {
    beforeEach(async function () {
      await auction.connect(seller).start();
    });

    it("被超出的竞拍者可以取回资金", async function () {
      await auction.connect(bidder1).bid({ value: STARTING_BID });
      await auction.connect(bidder2).bid({ value: ethers.parseEther("0.2") });

      const balanceBefore = await ethers.provider.getBalance(bidder1.address);
      const tx = await auction.connect(bidder1).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(bidder1.address);

      expect(balanceAfter + gasCost).to.equal(
        balanceBefore + STARTING_BID
      );
    });

    it("无可提取金额应回滚", async function () {
      await expect(
        auction.connect(bidder1).withdraw()
      ).to.be.revertedWith("Nothing to withdraw");
    });

    it("多人竞拍后每个人都能正确取回", async function () {
      await auction.connect(bidder1).bid({ value: STARTING_BID });
      await auction.connect(bidder2).bid({ value: ethers.parseEther("0.2") });
      await auction.connect(bidder3).bid({ value: ethers.parseEther("0.3") });

      // 验证 bidder1 取回了 STARTING_BID
      await expect(auction.connect(bidder1).withdraw()).to.changeEtherBalance(
        bidder1,
        STARTING_BID
      );

      // bidder2 也被 bidder3 超出，可以取回 0.2
      await expect(auction.connect(bidder2).withdraw()).to.changeEtherBalance(
        bidder2,
        ethers.parseEther("0.2")
      );

      // bidder3 是最高出价者，没有可提取的
      await expect(
        auction.connect(bidder3).withdraw()
      ).to.be.revertedWith("Nothing to withdraw");
    });
  });

  // ── 结算 ──────────────────────────────────────────────

  describe("auctionEnd()", function () {
    it("有出价时结算正确", async function () {
      await auction.connect(seller).start();
      await auction.connect(bidder1).bid({ value: STARTING_BID });

      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await auction.connect(seller).auctionEnd();

      expect(await auction.ended()).to.equal(true);
      expect(await nft.ownerOf(1)).to.equal(bidder1.address);
    });

    it("无人出价时 NFT 退还给卖家", async function () {
      await auction.connect(seller).start();

      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await auction.connect(seller).auctionEnd();

      expect(await nft.ownerOf(1)).to.equal(seller.address);
    });

    it("拍卖结束前不能结算", async function () {
      await auction.connect(seller).start();
      await expect(
        auction.connect(seller).auctionEnd()
      ).to.be.revertedWith("Auction not ended");
    });

    it("不能重复结算", async function () {
      await auction.connect(seller).start();
      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
      await auction.connect(seller).auctionEnd();
      await expect(
        auction.connect(seller).auctionEnd()
      ).to.be.revertedWith("Already settled");
    });

    it("卖家收到 ETH", async function () {
      await auction.connect(seller).start();
      await auction.connect(bidder1).bid({ value: STARTING_BID });

      await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      const balanceBefore = await ethers.provider.getBalance(seller.address);
      const tx = await auction.connect(seller).auctionEnd();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(seller.address);

      expect(balanceAfter + gasCost).to.equal(
        balanceBefore + STARTING_BID
      );
    });
  });

  // ── 取消 ──────────────────────────────────────────────

  describe("cancel()", function () {
    beforeEach(async function () {
      await auction.connect(seller).start();
    });

    it("无人出价时可以取消", async function () {
      await auction.connect(seller).cancel();
      expect(await auction.ended()).to.equal(true);
      expect(await nft.ownerOf(1)).to.equal(seller.address);
    });

    it("已有出价时不能取消", async function () {
      await auction.connect(bidder1).bid({ value: STARTING_BID });
      await expect(
        auction.connect(seller).cancel()
      ).to.be.revertedWith("Bids already placed");
    });

    it("非卖家取消应回滚", async function () {
      await expect(
        auction.connect(bidder1).cancel()
      ).to.be.revertedWith("Not seller");
    });
  });

  // ── 完整流程 ──────────────────────────────────────────

  it("完整竞拍流程：多人出价 → 结算", async function () {
    await auction.connect(seller).start();

    // bidder1 出价 0.1 ETH
    await auction.connect(bidder1).bid({ value: STARTING_BID });
    expect(await auction.highestBidder()).to.equal(bidder1.address);

    // bidder2 出价 0.2 ETH（超出 bidder1）
    await auction.connect(bidder2).bid({ value: ethers.parseEther("0.2") });
    expect(await auction.highestBidder()).to.equal(bidder2.address);

    // bidder3 出价 0.3 ETH（胜出）
    await auction.connect(bidder3).bid({ value: ethers.parseEther("0.3") });
    expect(await auction.highestBidder()).to.equal(bidder3.address);

    // 时间快进到拍卖结束
    await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
    await ethers.provider.send("evm_mine", []);

    // 结算
    await auction.connect(seller).auctionEnd();

    // 验证：bidder3 获得 NFT
    expect(await nft.ownerOf(1)).to.equal(bidder3.address);
    expect(await auction.ended()).to.equal(true);

    // 被超出的竞拍者取回资金
    await expect(auction.connect(bidder1).withdraw()).to.changeEtherBalance(
      bidder1,
      STARTING_BID
    );
    await expect(auction.connect(bidder2).withdraw()).to.changeEtherBalance(
      bidder2,
      ethers.parseEther("0.2")
    );

    // bidder3（胜出者）没有可提取的
    await expect(
      auction.connect(bidder3).withdraw()
    ).to.be.revertedWith("Nothing to withdraw");
  });
});
