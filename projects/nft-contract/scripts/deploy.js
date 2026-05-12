const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy(
    "MyNFT",
    "MNFT",
    "https://example.com/metadata/",
    deployer.address
  );

  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log("MyNFT 部署地址:", address);
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
