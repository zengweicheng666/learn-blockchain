const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const market = await Marketplace.deploy(250);
  await market.waitForDeployment();
  console.log("NFTMarketplace:", await market.getAddress());

  const AuctionManager = await ethers.getContractFactory("AuctionManager");
  const auctionMgr = await AuctionManager.deploy(250);
  await auctionMgr.waitForDeployment();
  console.log("AuctionManager:", await auctionMgr.getAddress());

  console.log("Platform fee:", (await market.platformFee()).toString(), "bps");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
