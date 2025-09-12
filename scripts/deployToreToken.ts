/**
 * ToreToken 배포 스크립트
 * 
 * 기능:
 * - ToreToken ERC-20 컨트랙트를 Avalanche 네트워크에 배포
 * - 초기 소유자 설정 및 토큰 정보 출력
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 및 초기 공급량 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: hardhat run scripts/deployToreToken.ts --network fuji
 * - Avalanche 메인넷: hardhat run scripts/deployToreToken.ts --network avalanche
 * 
 * 환경변수:
 * - PRIVATE_KEY: 배포자 개인키
 * - TORE_OWNER: 초기 소유자 주소 (기본값: 배포자 주소)
 */

import hre from "hardhat";
import { ethers } from "hardhat";

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. 배포자 계정 정보 가져오기
 * 2. 배포자 잔액 확인 및 출력
 * 3. 초기 소유자 주소 설정
 * 4. ToreToken 컨트랙트 팩토리 가져오기
 * 5. 컨트랙트 배포 실행
 * 6. 배포 완료 대기
 * 7. 배포된 컨트랙트 정보 출력
 * 8. 토큰 정보 확인 및 출력
 */
async function main() {
  // 배포자 계정 정보 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer:", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");

  // 초기 소유자 주소 설정 (환경변수 또는 배포자 주소)
  const initialOwner = process.env.TORE_OWNER ?? deployer.address;
  console.log("👤 Initial Owner:", initialOwner);

  // ToreToken 컨트랙트 팩토리 가져오기
  const ToreToken = await ethers.getContractFactory("ToreToken");
  
  // 컨트랙트 배포 실행 (초기 소유자 주소)
  console.log("📦 Deploying ToreToken...");
  const contract = await ToreToken.deploy(initialOwner);
  
  // 배포 완료 대기
  await contract.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await contract.getAddress();
  console.log("✅ ToreToken deployed to:", address);
  
  // 토큰 정보 확인 및 출력
  const tokenName = await contract.name();
  const tokenSymbol = await contract.symbol();
  const tokenDecimals = await contract.decimals();
  const totalSupply = await contract.totalSupply();
  const ownerBalance = await contract.balanceOf(initialOwner);
  
  console.log("\n📊 Token Information:");
  console.log("  Name:", tokenName);
  console.log("  Symbol:", tokenSymbol);
  console.log("  Decimals:", tokenDecimals);
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, tokenDecimals), "TORE");
  console.log("  Owner Balance:", ethers.formatUnits(ownerBalance, tokenDecimals), "TORE");
  
  // 네트워크 정보 출력
  const network = await ethers.provider.getNetwork();
  console.log("\n🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");
  
  // 배포 성공 메시지 및 환경변수 설정 안내
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Please update your .env file with:");
  console.log(`TORE_TOKEN_ADDRESS=${address}`);
  console.log(`TORE_TOKEN_OWNER=${initialOwner}`);
  
  // 게임 컨트랙트 연동을 위한 추가 정보
  console.log("\n🔗 For game integration:");
  console.log("  - Add game contracts using addGameContract()");
  console.log("  - Add game managers using addGameManager()");
  console.log("  - Add exchange contracts using addExchangeContract()");
  console.log("  - Use distributeGameReward() for player rewards");
  console.log("  - Use batchTransfer() for multiple transfers");
  console.log("  - Use exchangeTransfer() for NFT trading");
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
