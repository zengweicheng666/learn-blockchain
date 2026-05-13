const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO", function () {
  let voteToken, dao, target, deployer, voter1, voter2, voter3;
  const VOTING_PERIOD = 100; // blocks
  const QUORUM = 0;
  const THRESHOLD = ethers.parseEther("10");
  const MINT_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [deployer, voter1, voter2, voter3] = await ethers.getSigners();

    const VoteToken = await ethers.getContractFactory("VoteToken");
    voteToken = await VoteToken.deploy();

    await voteToken.mint(voter1.address, MINT_AMOUNT);
    await voteToken.mint(voter2.address, MINT_AMOUNT);
    await voteToken.mint(voter3.address, ethers.parseEther("5"));

    // 委托投票权给自己（必须先委托，投票权才生效）
    await voteToken.connect(voter1).delegate(voter1.address);
    await voteToken.connect(voter2).delegate(voter2.address);
    await voteToken.connect(voter3).delegate(voter3.address);

    const SimpleDAO = await ethers.getContractFactory("SimpleDAO");
    dao = await SimpleDAO.deploy(
      await voteToken.getAddress(),
      VOTING_PERIOD,
      QUORUM,
      THRESHOLD
    );

    const SimpleTarget = await ethers.getContractFactory("SimpleTarget");
    target = await SimpleTarget.deploy(await dao.getAddress());
  });

  // ── VoteToken ────────────────────────────────────────

  describe("VoteToken", function () {
    it("委托后投票权正确", async function () {
      const votes = await voteToken.getVotes(voter1.address);
      expect(votes).to.equal(MINT_AMOUNT);
    });

    it("未委托的地址投票权为 0", async function () {
      expect(await voteToken.getVotes(deployer.address)).to.equal(0);
    });

    it("转账后投票权自动更新", async function () {
      await voteToken
        .connect(voter1)
        .transfer(voter2.address, ethers.parseEther("10"));

      // voter1 投票权减少，voter2 增加
      expect(await voteToken.getVotes(voter1.address)).to.equal(
        MINT_AMOUNT - ethers.parseEther("10")
      );
      expect(await voteToken.getVotes(voter2.address)).to.equal(
        MINT_AMOUNT + ethers.parseEther("10")
      );
    });
  });

  // ── 创建提案 ────────────────────────────────────────

  describe("propose()", function () {
    it("有足够投票权者可创建提案", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      const tx = await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "Set value to 42");

      await expect(tx).to.emit(dao, "ProposalCreated");
      expect(await dao.proposalCount()).to.equal(1);
    });

    it("投票权不足时创建提案应回滚", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await expect(
        dao
          .connect(voter3)
          .propose(await target.getAddress(), 0, data, "Set value to 42")
      ).to.be.revertedWith("Below proposal threshold");
    });
  });

  // ── 投票 ────────────────────────────────────────────

  describe("vote()", function () {
    let proposalId;

    beforeEach(async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "Set value to 42");
      proposalId = 0;
    });

    it("投赞成票", async function () {
      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(proposalId, 1);
      expect(await dao.hasVoted(proposalId, voter1.address)).to.equal(true);
    });

    it("投反对票", async function () {
      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(proposalId, 0);
    });

    it("弃权", async function () {
      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(proposalId, 2);
    });

    it("重复投票应回滚", async function () {
      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(proposalId, 1);
      await expect(
        dao.connect(voter1).vote(proposalId, 1)
      ).to.be.revertedWith("Already voted");
    });
  });

  // ── 提案状态 ────────────────────────────────────────

  describe("getState()", function () {
    it("初始状态为 Pending", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");
      // 创建提案的同一区块中，proposal 处于 Pending
      expect(await dao.getState(0)).to.equal(0); // Pending
    });

    it("赞成 > 反对 即为 Succeeded", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      // 挖一个区块使提案进入 Active
      await ethers.provider.send("evm_mine", []);

      await dao.connect(voter1).vote(0, 1); // voter1 赞成（100票）
      await dao.connect(voter2).vote(0, 0); // voter2 反对（100票）

      // 推进到投票结束
      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // 赞成 = 反对，提案被否决
      expect(await dao.getState(0)).to.equal(2); // Defeated
    });

    it("赞成 > 反对 即为 Succeeded", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      await ethers.provider.send("evm_mine", []);

      await dao.connect(voter1).vote(0, 1); // 赞成 100
      // voter2 不投票

      for (let i = 0; i < VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      expect(await dao.getState(0)).to.equal(3); // Succeeded
    });
  });

  // ── 执行提案 ────────────────────────────────────────

  describe("execute()", function () {
    it("成功提案可执行", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "Set value to 42");

      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(0, 1); // 赞成

      // 推进到投票结束
      for (let i = 0; i <= VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await expect(dao.connect(voter1).execute(0)).to.emit(
        dao,
        "ProposalExecuted"
      );

      expect(await target.value()).to.equal(42);
    });

    it("投票未结束不能执行", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(0, 1);

      // 投票未结束
      await expect(dao.connect(voter1).execute(0)).to.be.revertedWith(
        "Voting not ended"
      );
    });

    it("不能重复执行", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(0, 1);

      for (let i = 0; i <= VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await dao.connect(voter1).execute(0);
      await expect(dao.connect(voter1).execute(0)).to.be.revertedWith(
        "Already executed"
      );
    });
  });

  // ── 取消提案 ────────────────────────────────────────

  describe("cancel()", function () {
    it("提案人可取消", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      await expect(dao.connect(voter1).cancel(0)).to.emit(
        dao,
        "ProposalCanceled"
      );
    });

    it("非提案人取消应回滚", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      await expect(dao.connect(voter2).cancel(0)).to.be.revertedWith(
        "Not proposer"
      );
    });

    it("已执行的提案不能取消", async function () {
      const data = target.interface.encodeFunctionData("setValue", [42]);
      await dao
        .connect(voter1)
        .propose(await target.getAddress(), 0, data, "test");

      await ethers.provider.send("evm_mine", []);
      await dao.connect(voter1).vote(0, 1);

      for (let i = 0; i <= VOTING_PERIOD; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await dao.connect(voter1).execute(0);
      await expect(dao.connect(voter1).cancel(0)).to.be.revertedWith(
        "Already executed"
      );
    });
  });

  // ── 完整治理流程 ────────────────────────────────────

  it("完整治理流程：委托 → 提案 → 投票 → 执行", async function () {
    // 1. voter1 创建提案：将 target.value 设为 99
    const targetAddr = await target.getAddress();
    const data = target.interface.encodeFunctionData("setValue", [99]);
    await dao
      .connect(voter1)
      .propose(targetAddr, 0, data, "Set value to 99");

    // 2. 推进一个区块使提案进入 Active
    await ethers.provider.send("evm_mine", []);

    // 3. voter1 和 voter2 投票赞成
    await dao.connect(voter1).vote(0, 1);
    await dao.connect(voter2).vote(0, 1);

    // 4. 推进到投票结束
    for (let i = 0; i <= VOTING_PERIOD; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    // 5. 执行提案
    await dao.connect(voter1).execute(0);

    // 6. 验证
    expect(await target.value()).to.equal(99);
    expect(await dao.getState(0)).to.equal(4); // Executed
  });
});
