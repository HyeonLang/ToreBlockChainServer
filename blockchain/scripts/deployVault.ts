/**
 * NFT Vault 배포 스크립트
 * 
 * 실행 흐름:
 * 1. Hardhat 네트워크에 연결
 * 2. 배포자 지갑 인스턴스 생성
 * 3. NftVault 컨트랙트 배포
 * 4. 배포된 컨트랙트 주소 출력
 * 
 * 실행 방법:
 * npx hardhat run blockchain/scripts/deployVault.ts --network localhost
 */

import { ethers } from "hardhat";

async function main() {
  console.log("=== NFT Vault 배포 시작 ===");

  // 배포자 정보 조회
  const [deployer] = await ethers.getSigners();
  console.log("배포자 주소:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("배포자 잔액:", ethers.formatEther(balance), "ETH");

  // Vault 컨트랙트 배포
  const NftVault = await ethers.getContractFactory("NftVault");
  console.log("\nNFT Vault 컨트랙트 배포 중...");
  
  const vault = await NftVault.deploy(deployer.address);
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();
  console.log("\n=== 배포 완료 ===");
  console.log("Vault 주소:", vaultAddress);
  console.log("\n⚠️  환경변수에 다음 주소를 추가하세요:");
  console.log(`VAULT_ADDRESS=${vaultAddress}`);
  console.log(`VAULT_ABI_PATH=blockchain/artifacts/blockchain/contracts/NftVault.sol/NftVault.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

