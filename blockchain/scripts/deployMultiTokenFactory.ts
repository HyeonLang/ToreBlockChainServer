/**
 * MultiTokenFactory 배포 스크립트
 * 
 * 기능:
 * - MultiTokenFactory 컨트랙트를 Avalanche 네트워크에 배포
 * - 다중 토큰 발행 시스템 초기화
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: hardhat run scripts/deployMultiTokenFactory.ts --network fuji
 * - Avalanche 메인넷: hardhat run scripts/deployMultiTokenFactory.ts --network avalanche
 */

import hre from "hardhat";
const { ethers } = hre as any;

async function main() {
  // 배포자 계정 정보 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer:", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");

  // MultiTokenFactory 컨트랙트 팩토리 가져오기
  const MultiTokenFactory = await ethers.getContractFactory("MultiTokenFactory");
  
  // 컨트랙트 배포 실행
  console.log("📦 Deploying MultiTokenFactory...");
  const factory = await MultiTokenFactory.deploy();
  
  // 배포 완료 대기
  await factory.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await factory.getAddress();
  console.log("✅ MultiTokenFactory deployed to:", address);
  
  // 네트워크 정보 출력
  const network = await ethers.provider.getNetwork();
  console.log("\n🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");
  
  // 배포 성공 메시지 및 환경변수 설정 안내
  console.log("\n🎉 MultiTokenFactory deployment completed successfully!");
  console.log("📝 Please update your .env file with:");
  console.log(`MULTI_TOKEN_FACTORY_ADDRESS=${address}`);
  
  // 첫 번째 토큰 생성 예시
  console.log("\n🔗 Example: Create your first token (toretest1)");
  console.log("Use the factory to create tokens with different names and symbols");
  console.log("Each token will be a separate ERC-20 contract");
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
