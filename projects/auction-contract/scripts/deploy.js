const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  // 部署测试 NFT
  const TestNFT = await ethers.getContractFactory("TestNFT");
  const nft = await TestNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFT 合约地址:", nftAddress);

  // 铸造 NFT
  const tx = await nft.mint(deployer.address);
  const receipt = await tx.wait();
  const tokenId = 1;
  console.log("已铸造 NFT #" + tokenId);

  // 部署拍卖合约
  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(
    nftAddress,
    tokenId,
    ethers.parseEther("0.01"), // 起拍价 0.01 ETH
    60 * 60 * 24 * 3           // 持续时间 3 天
  );
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log("拍卖合约地址:", auctionAddress);

  // 授权拍卖合约可转移 NFT
  await nft.approve(auctionAddress, tokenId);
  console.log("已授权拍卖合约操作 NFT");

  // 启动拍卖
  await auction.start();
  console.log("拍卖已启动！");
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + auctionAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
