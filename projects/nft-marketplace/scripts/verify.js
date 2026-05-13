const { ethers } = require("hardhat");

async function main() {
  const [deployer, seller, buyer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Seller:", seller.address);
  console.log("Buyer:", buyer.address);
  console.log();

  // Load deployed contracts
  const marketAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const auctionMgrAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const market = await ethers.getContractAt("NFTMarketplace", marketAddr);
  const auctionMgr = await ethers.getContractAt("AuctionManager", auctionMgrAddr);

  // Deploy test NFT
  const TestNFT = await ethers.getContractFactory("TestERC721");
  const nft = await TestNFT.deploy();
  await nft.waitForDeployment();
  console.log("Test NFT deployed at:", await nft.getAddress());

  // === Fixed Price Flow ===
  console.log("\n=== Fixed Price ===");
  await nft.mint(seller.address, 1);
  console.log("Minted token 1 to seller");

  await nft.connect(seller).approve(market.target, 1);
  console.log("Seller approved marketplace for token 1");

  const tx1 = await market.connect(seller).listItem(nft.target, 1, ethers.parseEther("10"));
  await tx1.wait();
  console.log("Listed token 1 at 10 ETH");

  const listing = await market.getListing(1);
  console.log("Listing active:", listing.active);

  const sellerBalBefore = await ethers.provider.getBalance(seller.address);
  const tx2 = await market.connect(buyer).buyItem(1, { value: ethers.parseEther("10.25") });
  await tx2.wait();
  const sellerBalAfter = await ethers.provider.getBalance(seller.address);

  console.log("Buyer bought token 1 for 10.25 ETH (10 + 2.5% fee)");
  console.log("Seller received:", ethers.formatEther(sellerBalAfter - sellerBalBefore), "ETH");
  console.log("NFT owner:", await nft.ownerOf(1));

  const fees = await market.accumulatedFees();
  console.log("Accumulated fees:", ethers.formatEther(fees), "ETH");

  // === Auction Flow ===
  console.log("\n=== Auction ===");
  await nft.mint(seller.address, 2);
  console.log("Minted token 2 to seller");

  await nft.connect(seller).approve(auctionMgr.target, 2);
  console.log("Seller approved auction manager for token 2");

  const tx3 = await auctionMgr.connect(seller).createAuction(nft.target, 2, ethers.parseEther("1"), 3600);
  await tx3.wait();
  console.log("Created auction for token 2, starting bid 1 ETH, duration 1h");

  // Bid
  const tx4 = await auctionMgr.connect(buyer).placeBid(1, { value: ethers.parseEther("2") });
  await tx4.wait();
  console.log("Buyer placed bid of 2 ETH");

  const auction = await auctionMgr.getAuction(1);
  console.log("Highest bid:", ethers.formatEther(auction[5]), "ETH");
  console.log("Highest bidder:", auction[4]);

  // Fast forward and end auction
  await ethers.provider.send("evm_increaseTime", [3601]);
  await ethers.provider.send("evm_mine");

  const tx5 = await auctionMgr.connect(buyer).endAuction(1);
  await tx5.wait();
  console.log("Auction ended");
  console.log("NFT token 2 owner:", await nft.ownerOf(2));
  console.log("Auction fees:", ethers.formatEther(await auctionMgr.accumulatedFees()), "ETH");

  // === Withdraw fees ===
  const tx6 = await market.connect(deployer).withdrawFees();
  await tx6.wait();
  console.log("\nOwner withdrew accumulated marketplace fees");
  console.log("Marketplace accumulated fees after withdraw:", ethers.formatEther(await market.accumulatedFees()), "ETH");

  console.log("\n✅ All flows verified!");
}

main().catch(console.error);
