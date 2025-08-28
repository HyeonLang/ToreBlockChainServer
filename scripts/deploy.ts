import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const name = process.env.NFT_NAME || "GameItem";
  const symbol = process.env.NFT_SYMBOL || "GMI";
  const GameItem = await ethers.getContractFactory("GameItem");
  const contract = await GameItem.deploy(name, symbol, deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("GameItem deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


