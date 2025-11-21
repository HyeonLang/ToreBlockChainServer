/**
 * MultiTokenFactory 배포 스크립트
 * 
 * 기능:
 * - MultiTokenFactory 컨트랙트를 Avalanche 네트워크에 배포
 * - TOKEN_OWNER 개인키를 사용하여 배포
 * - 다중 토큰 발행 시스템 초기화
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run deploy:factory:fuji
 * - Avalanche 메인넷: npm run deploy:factory:avalanche
 * 
 * 환경변수:
 * - TOKEN_OWNER: 토큰 소유자 개인키 (필수)
 * - RPC_URL 또는 FUJI_RPC_URL 또는 AVALANCHE_RPC_URL: 네트워크 RPC URL
 */

import { ethers } from "hardhat";

// hardhat이 이미 dotenv를 로드하므로 별도 import 불필요

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. TOKEN_OWNER 환경변수에서 개인키 확인
 * 2. 개인키로 지갑 생성 및 네트워크 연결
 * 3. 배포자 잔액 확인 및 출력
 * 4. MultiTokenFactory 컨트랙트 팩토리 가져오기
 * 5. TOKEN_OWNER 지갑으로 컨트랙트 배포 실행
 * 6. 배포 완료 대기
 * 7. 배포된 컨트랙트 주소 출력
 */
async function main() {
  // TOKEN_OWNER 개인키 확인
  const tokenOwnerPrivateKey = process.env.TOKEN_OWNER;
  if (!tokenOwnerPrivateKey) {
    throw new Error("❌ TOKEN_OWNER 환경변수가 설정되지 않았습니다. .env 파일에 TOKEN_OWNER를 설정해주세요.");
  }

  // 네트워크 정보 가져오기
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // RPC URL 확인 (환경변수 또는 하드햇 설정에서)
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || process.env.AVALANCHE_RPC_URL;
  if (rpcUrl) {
    console.log("🔗 RPC URL:", rpcUrl);
  }

  // TOKEN_OWNER 개인키로 지갑 생성
  const provider = ethers.provider;
  const deployer = new ethers.Wallet(tokenOwnerPrivateKey, provider);
  
  console.log("👤 Deployer (TOKEN_OWNER):", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");
  
  if (bal === 0n) {
    console.warn("⚠️  배포자 지갑의 잔액이 0입니다. 배포를 진행하려면 네트워크 토큰이 필요합니다.");
  }

  // MultiTokenFactory 컨트랙트 팩토리 가져오기
  const MultiTokenFactory = await ethers.getContractFactory("MultiTokenFactory");
  
  // 컨트랙트 배포 실행 (TOKEN_OWNER 지갑으로)
  console.log("\n🚀 배포 시작...");
  const factory = await MultiTokenFactory.connect(deployer).deploy();
  
  // 배포 완료 대기
  await factory.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await factory.getAddress();
  console.log("\n✅ 배포 완료!");
  console.log("📍 Contract Address:", address);
  console.log("👤 Contract Owner:", deployer.address);
  
  // 배포 성공 메시지 및 환경변수 업데이트 안내
  console.log("\n📝 .env 파일에 다음을 추가/수정하세요:");
  console.log(`MULTI_TOKEN_FACTORY_ADDRESS=${address}`);
  console.log(`TOKEN_OWNER=${tokenOwnerPrivateKey}`);
  
  // 첫 번째 토큰 생성 예시
  console.log("\n🔗 팩토리를 사용하여 다양한 토큰을 생성할 수 있습니다.");
  console.log("각 토큰은 독립적인 ERC-20 컨트랙트로 생성됩니다.");
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
