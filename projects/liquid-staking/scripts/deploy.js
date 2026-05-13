const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const LiquidStaking = await ethers.getContractFactory("LiquidStaking");
  const ls = await LiquidStaking.deploy(deployer.address);
  await ls.waitForDeployment();

  const addr = await ls.getAddress();
  console.log("LiquidStaking:", addr);
  console.log("stETH symbol:", await ls.symbol());
  console.log("APR:", (await ls.apr()).toString(), "basis points");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
