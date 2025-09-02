// 수정사항 250902
// ❌ 기존
// import { ethers } from "hardhat";
// 프로젝트가 ESM(“type":"module”) 모드라서 hardhat가 CommonJS인 점과 충돌 → import { ethers } from "hardhat"가 안 먹히는 상태.
// ✅ 수정
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 잔액 출력
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(bal), "AVAX");

  const name = process.env.NFT_NAME ?? "GameItem";
  const symbol = process.env.NFT_SYMBOL ?? "GMI";

  const GameItem = await hre.ethers.getContractFactory("GameItem");
  const contract = await GameItem.deploy(name, symbol, deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("GameItem deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
