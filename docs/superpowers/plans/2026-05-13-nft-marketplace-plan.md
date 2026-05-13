# NFT Marketplace 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 4 周内实现全栈 NFT 市场，支持固定价格交易和英式拍卖，带完整测试和 DApp 前端。

**Architecture:** 双合约架构 — NFTMarketplace（固定价格）+ AuctionManager（拍卖），共享 PlatformFee 抽象合约。前端在已有 DApp 项目中新增 `/market` 路由。

**Tech Stack:** Solidity ^0.8.28, Hardhat v2, OpenZeppelin v5, Next.js 16, Wagmi v2, viem v2

---

### Task 1: 初始化 Hardhat 项目

**Files:**
- Create: `projects/nft-marketplace/package.json`
- Create: `projects/nft-marketplace/hardhat.config.js`
- Create: `projects/nft-marketplace/.env.example`

- [ ] **Step 1: 创建项目目录并初始化**

```bash
mkdir -p projects/nft-marketplace
cd projects/nft-marketplace
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
cd projects/nft-marketplace
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

- [ ] **Step 3: 创建 hardhat.config.js**

```js
require("@nomicfoundation/hardhat-toolbox");

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
```

- [ ] **Step 4: 创建项目目录结构**

```bash
mkdir -p contracts/interfaces contracts/abstract test scripts
```

- [ ] **Step 5: 创建 .env.example**

```
# 无需额外配置，使用 Hardhat 内置账户
```

- [ ] **Step 6: 验证 Hardhat 可编译**

```bash
cd projects/nft-marketplace && npx hardhat compile
```

Expected: "Solidity ... compiled successfully"

- [ ] **Step 7: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "chore: initialize nft-marketplace Hardhat project"
```

---

### Task 2: PlatformFee 抽象合约 + 测试

**Files:**
- Create: `projects/nft-marketplace/contracts/abstract/PlatformFee.sol`
- Create: `projects/nft-marketplace/test/PlatformFee.test.js`

- [ ] **Step 1: 编写 PlatformFee.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PlatformFee is Ownable {
    uint256 public platformFee;
    uint256 public accumulatedFees;
    uint256 public constant MAX_FEE = 1000; // max 10%

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    constructor(uint256 _initialFee) Ownable(msg.sender) {
        require(_initialFee <= MAX_FEE, "Fee too high");
        platformFee = _initialFee;
    }

    function calculateFee(uint256 amount) public view returns (uint256 feeAmount, uint256 netAmount) {
        feeAmount = (amount * platformFee) / 10000;
        netAmount = amount - feeAmount;
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        emit PlatformFeeUpdated(oldFee, _newFee);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
        emit FeesWithdrawn(owner(), amount);
    }

    receive() external payable {}
}
```

- [ ] **Step 2: 编写 PlatformFee 测试（先写一个实现合约用于测试）**

```js
// test/PlatformFee.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Minimal concrete implementation for testing
const PLATFORM_FEE_IMPLEMENTATION = `
import "./abstract/PlatformFee.sol";
contract TestPlatformFee is PlatformFee {
    constructor(uint256 _initialFee) PlatformFee(_initialFee) {}
    function mockRevenue() external payable {}
}
`;

describe("PlatformFee", function () {
  async function deployFixture() {
    const [owner, user1] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TestPlatformFee");
    const impl = await factory.deploy(250); // 2.5%
    await impl.waitForDeployment();
    return { impl, owner, user1 };
  }

  it("should set initial fee", async function () {
    const { impl } = await loadFixture(deployFixture);
    expect(await impl.platformFee()).to.equal(250);
  });

  it("should reject fee > MAX_FEE", async function () {
    const factory = await ethers.getContractFactory("TestPlatformFee");
    await expect(factory.deploy(1001)).to.be.revertedWith("Fee too high");
  });

  it("should calculate fee correctly", async function () {
    const { impl } = await loadFixture(deployFixture);
    const [fee, net] = await impl.calculateFee(ethers.parseEther("100"));
    expect(fee).to.equal(ethers.parseEther("2.5"));
    expect(net).to.equal(ethers.parseEther("97.5"));
  });

  it("should allow owner to update fee", async function () {
    const { impl } = await loadFixture(deployFixture);
    await impl.setPlatformFee(500);
    expect(await impl.platformFee()).to.equal(500);
  });

  it("should reject fee update from non-owner", async function () {
    const { impl, user1 } = await loadFixture(deployFixture);
    await expect(impl.connect(user1).setPlatformFee(500))
      .to.be.revertedWithCustomError(impl, "OwnableUnauthorizedAccount");
  });

  it("should accumulate and withdraw fees", async function () {
    const { impl, owner } = await loadFixture(deployFixture);
    // Simulate revenue
    await owner.sendTransaction({ to: impl.target, value: ethers.parseEther("10") });
    await impl.mockRevenue({ value: ethers.parseEther("5") });
    // Manually add to accumulated fees for testing
    // (In real use, marketplace contracts call calculateFee and add to accumulatedFees)
    const balBefore = await ethers.provider.getBalance(owner.address);
    const tx = await impl.withdrawFees();
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(owner.address);
    // accumulatedFees starts at 0 in this test
    expect(balAfter + gasCost - balBefore).to.equal(0);
  });
});
```

Wait — the test for withdrawFees needs accumulatedFees to be non-zero. Let me adjust. Actually, the PlatformFee contract doesn't have a direct way to add to accumulatedFees — it's the subclasses (NFTMarketplace, AuctionManager) that call `calculateFee` and track fees. So the test contract needs a way to add fees for testing.

Actually, I'll set the test up differently — make the test simpler:

```js
describe("PlatformFee", function () {
  async function deployFixture() {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TestPlatformFee");
    const impl = await factory.deploy(250);
    await impl.waitForDeployment();
    return { impl, owner };
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
});
```

- [ ] **Step 3: 运行测试**

```bash
cd projects/nft-marketplace && npx hardhat test test/PlatformFee.test.js
```

Expected: 7 passing

- [ ] **Step 4: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "feat: add PlatformFee abstract contract with tests"
```

---

### Task 3: 智能合约接口

**Files:**
- Create: `projects/nft-marketplace/contracts/interfaces/IMarketplace.sol`
- Create: `projects/nft-marketplace/contracts/interfaces/IAuctionManager.sol`

- [ ] **Step 1: 编写 IMarketplace.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    event Listed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event Bought(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price, uint256 fee);
    event ListingCancelled(uint256 indexed listingId);

    function listItem(address nftContract, uint256 tokenId, uint256 price) external returns (uint256 listingId);
    function buyItem(uint256 listingId) external payable;
    function cancelListing(uint256 listingId) external;
    function getListing(uint256 listingId) external view returns (Listing memory);
    function listingCount() external view returns (uint256);
}
```

- [ ] **Step 2: 编写 IAuctionManager.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAuctionManager {
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 startingBid, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event BidWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 winningBid, uint256 fee);

    function createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration) external returns (uint256 auctionId);
    function placeBid(uint256 auctionId) external payable;
    function withdrawBid(uint256 auctionId) external;
    function endAuction(uint256 auctionId) external;
    function auctionCount() external view returns (uint256);
}
```

- [ ] **Step 3: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "feat: add IMarketplace and IAuctionManager interfaces"
```

---

### Task 4: NFTMarketplace 合约

**Files:**
- Create: `projects/nft-marketplace/contracts/NFTMarketplace.sol`
- Create: `projects/nft-marketplace/test/NFTMarketplace.test.js`

- [ ] **Step 1: 编写 NFTMarketplace.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketplace.sol";
import "./abstract/PlatformFee.sol";

contract NFTMarketplace is IMarketplace, PlatformFee, ReentrancyGuard {
    uint256 private _listingIdCounter;
    mapping(uint256 => Listing) private _listings;

    constructor(uint256 _initialFee) PlatformFee(_initialFee) {}

    function listItem(address nftContract, uint256 tokenId, uint256 price) external override returns (uint256 listingId) {
        require(price > 0, "Price must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        _listingIdCounter++;
        listingId = _listingIdCounter;

        _listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
    }

    function buyItem(uint256 listingId) external override payable nonReentrant {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Not active");
        require(listing.seller != msg.sender, "Cannot buy own item");

        (uint256 fee, uint256 netAmount) = calculateFee(listing.price);
        require(msg.value >= listing.price + fee, "Insufficient payment");

        listing.active = false;
        accumulatedFees += fee;

        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        payable(listing.seller).transfer(netAmount);

        // Refund excess payment
        uint256 excess = msg.value - listing.price - fee;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        emit Bought(listingId, msg.sender, listing.seller, listing.price, fee);
    }

    function cancelListing(uint256 listingId) external override {
        Listing storage listing = _listings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Not active");

        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(listingId);
    }

    function getListing(uint256 listingId) external view override returns (Listing memory) {
        return _listings[listingId];
    }

    function listingCount() external view override returns (uint256) {
        return _listingIdCounter;
    }
}
```

- [ ] **Step 2: 编写 NFTMarketplace 测试**

```js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("NFTMarketplace", function () {
  async function deployFixture() {
    const [owner, seller, buyer] = await ethers.getSigners();
    // Deploy a test ERC721
    const TestNFT = await ethers.getContractFactory("TestERC721");
    const nft = await TestNFT.deploy("Test NFT", "TNFT");
    await nft.waitForDeployment();
    // Deploy marketplace
    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    const market = await Marketplace.deploy(250); // 2.5% fee
    await market.waitForDeployment();
    // Mint NFT to seller
    await nft.mint(seller.address, 1);
    return { market, nft, owner, seller, buyer };
  }

  // Test ERC721
  const ERC721_ARTIFACT = {
    abi: [
      "function mint(address to, uint256 tokenId) external",
      "function approve(address to, uint256 tokenId) external",
      "function setApprovalForAll(address operator, bool approved) external",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function balanceOf(address owner) view returns (uint256)",
    ],
    bytecode: "..." // Will use actual compiled TestERC721
  };

  describe("Listing", function () {
    it("should revert if price is 0", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(market.target, 1);
      await expect(market.connect(seller).listItem(nft.target, 1, 0))
        .to.be.revertedWith("Price must be > 0");
    });

    it("should revert if not owner", async function () {
      const { market, nft, buyer } = await loadFixture(deployFixture);
      await expect(market.connect(buyer).listItem(nft.target, 1, ethers.parseEther("1")))
        .to.be.revertedWith("Not owner");
    });

    it("should revert if not approved", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await expect(market.connect(seller).listItem(nft.target, 1, ethers.parseEther("1")))
        .to.be.revertedWith("Not approved");
    });

    it("should list an NFT and transfer to contract", async function () {
      const { market, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(market.target, 1);
      const tx = await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));
      await expect(tx).to.emit(market, "Listed").withArgs(1, seller.address, nft.target, 1, ethers.parseEther("10"));
      expect(await nft.ownerOf(1)).to.equal(market.target);
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

    it("should allow buying a listed NFT", async function () {
      const { market, nft, seller, buyer } = await loadFixture(listedFixture);
      const price = ethers.parseEther("10");
      const fee = ethers.parseEther("0.25"); // 2.5%
      const total = price + fee;

      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      const tx = await market.connect(buyer).buyItem(1, { value: total });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      expect(await nft.ownerOf(1)).to.equal(buyer.address);
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalAfter - sellerBalBefore).to.equal(price);
    });

    it("should revert if insufficient payment", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await expect(market.connect(buyer).buyItem(1, { value: ethers.parseEther("5") }))
        .to.be.revertedWith("Insufficient payment");
    });

    it("should revert if seller tries to buy own item", async function () {
      const { market, seller } = await loadFixture(listedFixture);
      const total = ethers.parseEther("10.25");
      await expect(market.connect(seller).buyItem(1, { value: total }))
        .to.be.revertedWith("Cannot buy own item");
    });

    it("should revert if listing is not active", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await market.connect(buyer).buyItem(1, { value: ethers.parseEther("10.25") });
      await expect(market.connect(buyer).buyItem(1, { value: ethers.parseEther("10.25") }))
        .to.be.revertedWith("Not active");
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

    it("should allow seller to cancel", async function () {
      const { market, nft, seller } = await loadFixture(listedFixture);
      const tx = await market.connect(seller).cancelListing(1);
      await expect(tx).to.emit(market, "ListingCancelled").withArgs(1);
      expect(await nft.ownerOf(1)).to.equal(seller.address);
    });

    it("should reject cancel from non-seller", async function () {
      const { market, buyer } = await loadFixture(listedFixture);
      await expect(market.connect(buyer).cancelListing(1))
        .to.be.revertedWith("Not seller");
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
  });
});
```

Note: Need to deploy a simple ERC721 test contract. Let's include it as a separate compiled contract:

```solidity
// contracts/test/TestERC721.sol
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract TestERC721 is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
```

Actually, I can deploy using ethers directly with a deployContract that creates a minimal ERC721. Let me use a simpler approach — deploy the existing ERC721 from OZ by creating a test contract in the test setup.

Let me revise the approach — I'll create a TestERC721 contract alongside the project for testing purposes.

- [ ] **Step 3: 创建 TestERC721 合约**

```solidity
// contracts/test/TestERC721.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract TestERC721 is ERC721 {
    constructor() ERC721("Test NFT", "TNFT") {}
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
```

- [ ] **Step 4: 运行测试**

```bash
cd projects/nft-marketplace && npx hardhat test test/NFTMarketplace.test.js
```

Expected: 10+ passing

- [ ] **Step 5: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "feat: add NFTMarketplace contract with tests"
```

---

### Task 5: AuctionManager 合约

**Files:**
- Create: `projects/nft-marketplace/contracts/AuctionManager.sol`
- Create: `projects/nft-marketplace/test/AuctionManager.test.js`

- [ ] **Step 1: 编写 AuctionManager.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAuctionManager.sol";
import "./abstract/PlatformFee.sol";

contract AuctionManager is IAuctionManager, PlatformFee, ReentrancyGuard {
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingBid;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool active;
        bool ended;
    }

    uint256 private _auctionIdCounter;
    mapping(uint256 => Auction) private _auctions;
    mapping(uint256 => mapping(address => uint256)) private _pendingReturns;

    constructor(uint256 _initialFee) PlatformFee(_initialFee) {}

    function createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration)
        external override returns (uint256 auctionId)
    {
        require(startingBid > 0, "Starting bid must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        _auctionIdCounter++;
        auctionId = _auctionIdCounter;

        _auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startingBid: startingBid,
            highestBidder: address(0),
            highestBid: 0,
            endTime: block.timestamp + duration,
            active: true,
            ended: false
        });

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingBid, block.timestamp + duration);
    }

    function placeBid(uint256 auctionId) external override payable {
        Auction storage auction = _auctions[auctionId];
        require(auction.active, "Not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(!auction.ended, "Already settled");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value >= auction.startingBid, "Below starting bid");
        require(msg.value > auction.highestBid, "Bid too low");

        // Refund previous highest bidder (Pull pattern)
        if (auction.highestBidder != address(0)) {
            _pendingReturns[auctionId][auction.highestBidder] += auction.highestBid;
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function withdrawBid(uint256 auctionId) external override {
        uint256 amount = _pendingReturns[auctionId][msg.sender];
        require(amount > 0, "Nothing to withdraw");

        _pendingReturns[auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit BidWithdrawn(auctionId, msg.sender, amount);
    }

    function endAuction(uint256 auctionId) external override nonReentrant {
        Auction storage auction = _auctions[auctionId];
        require(auction.active, "Not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.ended, "Already settled");

        auction.active = false;
        auction.ended = true;

        if (auction.highestBidder == address(0)) {
            // No bids — return NFT to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(auctionId, address(0), 0, 0);
        } else {
            // Winner gets NFT, seller gets highest bid minus fee
            (uint256 fee, uint256 netAmount) = calculateFee(auction.highestBid);
            accumulatedFees += fee;

            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            payable(auction.seller).transfer(netAmount);

            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid, fee);
        }
    }

    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return _auctions[auctionId];
    }

    function getPendingReturn(uint256 auctionId, address bidder) external view returns (uint256) {
        return _pendingReturns[auctionId][bidder];
    }

    function auctionCount() external view override returns (uint256) {
        return _auctionIdCounter;
    }
}
```

- [ ] **Step 2: 编写 AuctionManager 测试**

```js
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

  describe("Create Auction", function () {
    it("should revert if starting bid is 0", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await expect(auctionMgr.connect(seller).createAuction(nft.target, 1, 0, 86400))
        .to.be.revertedWith("Starting bid must be > 0");
    });

    it("should revert if duration is 0", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await expect(auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 0))
        .to.be.revertedWith("Duration must be > 0");
    });

    it("should revert if not approved", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await expect(auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400))
        .to.be.revertedWith("Not approved");
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
    async function auctionFixture() {
      const base = await deployFixture();
      const { auctionMgr, nft, seller } = base;
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      return base;
    }

    it("should place a valid bid", async function () {
      const { auctionMgr, bidder1 } = await loadFixture(auctionFixture);
      const tx = await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("2") });
      await expect(tx).to.emit(auctionMgr, "BidPlaced").withArgs(1, bidder1.address, ethers.parseEther("2"));
    });

    it("should revert if bid below starting price", async function () {
      const { auctionMgr, bidder1 } = await loadFixture(auctionFixture);
      await expect(auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.5") }))
        .to.be.revertedWith("Below starting bid");
    });

    it("should revert if seller bids", async function () {
      const { auctionMgr, seller } = await loadFixture(auctionFixture);
      await expect(auctionMgr.connect(seller).placeBid(1, { value: ethers.parseEther("2") }))
        .to.be.revertedWith("Seller cannot bid");
    });

    it("should reject bid lower than current highest", async function () {
      const { auctionMgr, bidder1, bidder2 } = await loadFixture(auctionFixture);
      await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("2") });
      await expect(auctionMgr.connect(bidder2).placeBid(1, { value: ethers.parseEther("1.5") }))
        .to.be.revertedWith("Bid too low");
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
      const { auctionMgr, bidder1 } = await loadFixture(auctionFixture);
      await expect(auctionMgr.connect(bidder1).withdrawBid(1))
        .to.be.revertedWith("Nothing to withdraw");
    });
  });

  describe("End Auction", function () {
    async function auctionWithBidsFixture() {
      const base = await deployFixture();
      const { auctionMgr, nft, seller, bidder1 } = base;
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 1);
      // Bid within the same block
      await auctionMgr.connect(bidder1).placeBid(1, { value: ethers.parseEther("5") });
      // Fast forward
      await ethers.provider.send("evm_increaseTime", [2]);
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
      // 5 - 2.5% = 4.875 ETH
      expect(sellerBalAfter - sellerBalBefore).to.equal(ethers.parseEther("4.875"));
    });

    it("should revert if auction not ended", async function () {
      const { auctionMgr, nft, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(auctionMgr.target, 1);
      await auctionMgr.connect(seller).createAuction(nft.target, 1, ethers.parseEther("1"), 86400);
      await expect(auctionMgr.connect(seller).endAuction(1))
        .to.be.revertedWith("Auction not ended");
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
```

- [ ] **Step 3: 运行测试**

```bash
cd projects/nft-marketplace && npx hardhat test test/AuctionManager.test.js
```

Expected: 12+ passing

- [ ] **Step 4: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "feat: add AuctionManager contract with tests"
```

---

### Task 6: 集成测试

**Files:**
- Create: `projects/nft-marketplace/test/integration.test.js`

- [ ] **Step 1: 编写集成测试**

```js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Integration", function () {
  async function fullFixture() {
    const [owner, seller, buyer1, buyer2] = await ethers.getSigners();
    
    // Deploy NFT
    const TestNFT = await ethers.getContractFactory("TestERC721");
    const nft = await TestNFT.deploy();
    await nft.waitForDeployment();
    
    // Deploy both marketplace contracts
    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    const market = await Marketplace.deploy(250);
    await market.waitForDeployment();
    
    const AuctionManager = await ethers.getContractFactory("AuctionManager");
    const auctionMgr = await AuctionManager.deploy(250);
    await auctionMgr.waitForDeployment();
    
    return { market, auctionMgr, nft, owner, seller, buyer1, buyer2 };
  }

  it("full flow: mint → approve → list → buy", async function () {
    const { market, nft, seller, buyer1 } = await loadFixture(fullFixture);
    
    await nft.mint(seller.address, 1);
    await nft.connect(seller).setApprovalForAll(market.target, true);
    await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));
    
    const sellerBalBefore = await ethers.provider.getBalance(seller.address);
    await market.connect(buyer1).buyItem(1, { value: ethers.parseEther("10.25") });
    const sellerBalAfter = await ethers.provider.getBalance(seller.address);
    
    expect(await nft.ownerOf(1)).to.equal(buyer1.address);
    expect(sellerBalAfter - sellerBalBefore).to.equal(ethers.parseEther("10"));
  });

  it("full flow: mint → approve → auction → bid → end", async function () {
    const { auctionMgr, nft, seller, buyer1 } = await loadFixture(fullFixture);
    
    await nft.mint(seller.address, 2);
    await nft.connect(seller).setApprovalForAll(auctionMgr.target, true);
    await auctionMgr.connect(seller).createAuction(nft.target, 2, ethers.parseEther("1"), 86400);
    await auctionMgr.connect(buyer1).placeBid(2, { value: ethers.parseEther("5") });
    
    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");
    
    await auctionMgr.connect(buyer1).endAuction(2);
    
    expect(await nft.ownerOf(2)).to.equal(buyer1.address);
    expect(await auctionMgr.accumulatedFees()).to.equal(ethers.parseEther("0.125")); // 2.5% of 5
  });

  it("multiple users competing in auction", async function () {
    const { auctionMgr, nft, seller, buyer1, buyer2 } = await loadFixture(fullFixture);
    
    await nft.mint(seller.address, 3);
    await nft.connect(seller).setApprovalForAll(auctionMgr.target, true);
    await auctionMgr.connect(seller).createAuction(nft.target, 3, ethers.parseEther("1"), 86400);
    
    await auctionMgr.connect(buyer1).placeBid(3, { value: ethers.parseEther("2") });
    await auctionMgr.connect(buyer2).placeBid(3, { value: ethers.parseEther("5") });
    
    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");
    
    // Outbid buyer1 withdraws
    const balBefore = await ethers.provider.getBalance(buyer1.address);
    const tx = await auctionMgr.connect(buyer1).withdrawBid(3);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(buyer1.address);
    expect(balAfter + gasCost - balBefore).to.equal(ethers.parseEther("2"));
    
    await auctionMgr.connect(buyer2).endAuction(3);
    expect(await nft.ownerOf(3)).to.equal(buyer2.address);
  });
});
```

- [ ] **Step 2: 运行集成测试**

```bash
cd projects/nft-marketplace && npx hardhat test test/integration.test.js
```

Expected: 3 passing

- [ ] **Step 3: 运行全部测试**

```bash
cd projects/nft-marketplace && npx hardhat test
```

Expected: 25+ passing

- [ ] **Step 4: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "test: add integration tests for NFT marketplace"
```

---

### Task 7: 部署脚本 + README

**Files:**
- Create: `projects/nft-marketplace/scripts/deploy.js`
- Create: `projects/nft-marketplace/README.md`

- [ ] **Step 1: 编写 deploy.js**

```js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy NFTMarketplace with 2.5% fee
  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const market = await Marketplace.deploy(250);
  await market.waitForDeployment();
  const marketAddr = await market.getAddress();
  console.log("NFTMarketplace:", marketAddr);

  // Deploy AuctionManager with 2.5% fee
  const AuctionManager = await ethers.getContractFactory("AuctionManager");
  const auctionMgr = await AuctionManager.deploy(250);
  await auctionMgr.waitForDeployment();
  const auctionMgrAddr = await auctionMgr.getAddress();
  console.log("AuctionManager:", auctionMgrAddr);

  console.log("Platform fee:", (await market.platformFee()).toString(), "bps");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: 启动 Hardhat 节点并部署**

```bash
# 终端 1
cd projects/nft-marketplace && npx hardhat node

# 终端 2
cd projects/nft-marketplace && npx hardhat run scripts/deploy.js --network localhost
```

Expected: 合约地址输出

- [ ] **Step 3: 编写 README.md**

```markdown
# NFT Marketplace

Phase 3 实战项目二：全栈 NFT 市场。

## 架构

双合约设计：

| 合约 | 职责 |
|------|------|
| NFTMarketplace | 固定价格上架、购买、取消 |
| AuctionManager | 英式拍卖创建、出价、退款、结算 |
| PlatformFee (abstract) | 共享平台费逻辑 (2.5%) |

## 环境

| 项目 | 版本 |
|------|------|
| Solidity | ^0.8.28 |
| Hardhat | ^2.28 |
| OpenZeppelin | ^5.6 |

## 快速开始

```bash
npm install
npx hardhat compile
npx hardhat test
```

## 部署

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## 测试

| 文件 | 用例数 | 覆盖 |
|------|--------|------|
| PlatformFee.test.js | 7 | 费率和计算 |
| NFTMarketplace.test.js | 10+ | 上架/购买/取消 |
| AuctionManager.test.js | 12+ | 创建/出价/退款/结算 |
| integration.test.js | 3 | 完整流程 |

## NFT 流转

### 固定价格
```
卖家 approve → listItem → NFT 托管 → buyItem → NFT 给买家，ETH 给卖家
```

### 拍卖
```
卖家 approve → createAuction → NFT 托管 → placeBid(多次) → endAuction → NFT 给赢家
```
```

- [ ] **Step 4: 提交**

```bash
git add projects/nft-marketplace/
git commit -m "feat: add deploy script and README"
```

---

### Task 8: DApp 前端 — 合约配置

**Files:**
- Modify: `projects/dapp/src/lib/contracts.ts`

- [ ] **Step 1: 添加市场合约地址和 ABI**

在 `contracts.ts` 中添加：

```ts
export const MARKETPLACE_ADDRESS = "0x..."; // 部署后获取
export const AUCTION_MANAGER_ADDRESS = "0x..."; // 部署后获取

export const MARKETPLACE_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "_initialFee", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "listingCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "price", type: "uint256" }], name: "listItem", outputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], name: "buyItem", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], name: "cancelListing", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }], name: "getListing", outputs: [{ internalType: "address", name: "seller", type: "address" }, { internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "price", type: "uint256" }, { internalType: "bool", name: "active", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "platformFee", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "accumulatedFees", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_newFee", type: "uint256" }], name: "setPlatformFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdrawFees", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "listingId", type: "uint256" }, { indexed: true, internalType: "address", name: "seller", type: "address" }, { indexed: true, internalType: "address", name: "nftContract", type: "address" }, { indexed: false, internalType: "uint256", name: "tokenId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "price", type: "uint256" }], name: "Listed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "listingId", type: "uint256" }, { indexed: true, internalType: "address", name: "buyer", type: "address" }, { indexed: true, internalType: "address", name: "seller", type: "address" }, { indexed: false, internalType: "uint256", name: "price", type: "uint256" }, { indexed: false, internalType: "uint256", name: "fee", type: "uint256" }], name: "Bought", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "uint256", name: "listingId", type: "uint256" }], name: "ListingCancelled", type: "event" },
] as const;

export const AUCTION_MANAGER_ABI = [
  { inputs: [{ internalType: "uint256", name: "_initialFee", type: "uint256" }], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "auctionCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "nftContract", type: "address" }, { internalType: "uint256", name: "tokenId", type: "uint256" }, { internalType: "uint256", name: "startingBid", type: "uint256" }, { internalType: "uint256", name: "duration", type: "uint256" }], name: "createAuction", outputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "placeBid", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "withdrawBid", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "auctionId", type: "uint256" }], name: "endAuction", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;
```

- [ ] **Step 2: 提交**

```bash
git add projects/dapp/src/lib/contracts.ts
git commit -m "feat: add marketplace and auction manager ABIs to contracts config"
```

---

### Task 9: DApp 前端 — 市场页面

**Files:**
- Modify: `projects/dapp/src/app/nav.tsx`
- Create: `projects/dapp/src/app/market/page.tsx`
- Create: `projects/dapp/src/app/market/listings/page.tsx`
- Create: `projects/dapp/src/app/market/auctions/page.tsx`
- Create: `projects/dapp/src/app/market/my/page.tsx`

- [ ] **Step 1: 导航栏添加 Market 链接**

```tsx
const links = [
  { href: "/", label: "Home" },
  { href: "/dao", label: "DAO" },
  { href: "/stake", label: "Stake" },
  { href: "/market", label: "Market" },
];
```

- [ ] **Step 2: 创建 /market 页面（总览）**

显示平台统计信息：上架数量、拍卖数量、累计平台费用

使用 `useReadContract` 读取 `listingCount()`, `auctionCount()`, `accumulatedFees()`

- [ ] **Step 3: 创建 /market/listings 页面**

遍历 listings，使用 NftCard 组件展示每个上架，包含：
- NFT 信息和 tokenId
- 价格
- Buy 按钮（调用 buyItem）
- Cancel 按钮（仅卖家可见）

- [ ] **Step 4: 创建 /market/auctions 页面**

遍历 auctions，显示：
- NFT 信息和 tokenId
- 起拍价 / 当前最高价
- 倒计时
- Place Bid 按钮
- End Auction 按钮（时间到后）
- Withdraw 按钮（被超出者）

- [ ] **Step 5: 创建 /market/my 页面**

用户视角：
- 持有的 NFT 列表（使用 `balanceOf` 方法）
- 我的上架（filter active listings by seller）
- 我的出价（pending returns）

- [ ] **Step 6: 验证构建**

```bash
cd projects/dapp && npm run build
```

Expected: Build successful, `/market` and sub-routes generated

- [ ] **Step 7: 提交**

```bash
git add projects/dapp/
git commit -m "feat: add NFT marketplace frontend pages"
```

---

### Task 10: 最终集成 + 笔记 + 文档

**Files:**
- Create: `notes/phase3/week13-16-nft-marketplace.md`

- [ ] **Step 1: 更新笔记**

```markdown
# Week 13-16：NFT 市场全栈实现

## 学习目标
- 双合约架构设计（固定价格 + 拍卖）
- PlatformFee 抽象合约复用
- 前端市场页面开发
- 完整测试覆盖

## 合约架构

NFTMarketplace（固定价格）
├── listItem / buyItem / cancelListing

AuctionManager（英式拍卖）
├── createAuction / placeBid / withdrawBid / endAuction

PlatformFee（抽象）
├── calculateFee / setPlatformFee / withdrawFees

## 测试

...
```

- [ ] **Step 2: 更新根目录 README**

- [ ] **Step 3: 部署合约并记录地址**

- [ ] **Step 4: 最终提交 + 推送 GitHub**

```bash
git add .
git commit -m "feat: Week 13-16 NFT 市场全栈实现"
git push
```
