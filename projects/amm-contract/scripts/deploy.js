const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  // 部署两个测试代币
  const TestToken = await ethers.getContractFactory("TestToken");
  const tokenA = await TestToken.deploy("TokenA", "TKA", 18);
  const tokenB = await TestToken.deploy("TokenB", "TKB", 18);
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();
  console.log("TokenA:", await tokenA.getAddress());
  console.log("TokenB:", await tokenB.getAddress());

  // 给部署者铸造代币
  const mintAmount = ethers.parseEther("10000");
  await tokenA.mint(deployer.address, mintAmount);
  await tokenB.mint(deployer.address, mintAmount);

  // 部署 AMM
  const SimpleAMM = await ethers.getContractFactory("SimpleAMM");
  const amm = await SimpleAMM.deploy(await tokenA.getAddress(), await tokenB.getAddress());
  await amm.waitForDeployment();
  const ammAddr = await amm.getAddress();
  console.log("AMM:", ammAddr);

  // 添加流动性
  const liqA = ethers.parseEther("100");
  const liqB = ethers.parseEther("10000");
  await tokenA.approve(ammAddr, liqA);
  await tokenB.approve(ammAddr, liqB);
  await amm.addLiquidity(liqA, liqB);
  console.log("已添加流动性: 100 A + 10000 B");
  console.log("LP 份额:", await amm.balanceOf(deployer.address));
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + ammAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
