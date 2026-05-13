const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  // 部署 VoteToken
  const VoteToken = await ethers.getContractFactory("VoteToken");
  const voteToken = await VoteToken.deploy();
  await voteToken.waitForDeployment();
  const vtAddr = await voteToken.getAddress();
  console.log("VoteToken:", vtAddr);

  // 铸造代币给部署者
  const mintAmount = ethers.parseEther("10000");
  await voteToken.mint(deployer.address, mintAmount);

  // 委托投票权给自己
  await voteToken.delegate(deployer.address);
  console.log("已委托投票权");

  // 部署 DAO
  const SimpleDAO = await ethers.getContractFactory("SimpleDAO");
  const dao = await SimpleDAO.deploy(
    vtAddr,
    100, // votingPeriod: 100 blocks (~20 min)
    0, // quorum: 0
    ethers.parseEther("10") // proposalThreshold: 10 票
  );
  await dao.waitForDeployment();
  const daoAddr = await dao.getAddress();
  console.log("SimpleDAO:", daoAddr);

  // 部署目标合约（DAO 作为 owner）
  const SimpleTarget = await ethers.getContractFactory("SimpleTarget");
  const target = await SimpleTarget.deploy(daoAddr);
  await target.waitForDeployment();
  console.log("SimpleTarget:", await target.getAddress());

  console.log("Etherscan:", "https://sepolia.etherscan.io/address/" + daoAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
