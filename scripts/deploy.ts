/**
 * 스마트 컨트랙트 배포 스크립트
 * 
 * 기능:
 * - GameItem NFT 컨트랙트를 Avalanche 네트워크에 배포
 * - 환경변수에서 컨트랙트 이름과 심볼 설정
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run deploy:fuji
 * - Avalanche 메인넷: npm run deploy:avalanche
 * 
 * 환경변수:
 * - PRIVATE_KEY: 배포자 개인키
 * - NFT_NAME: 컨트랙트 이름 (기본값: "GameItem")
 * - NFT_SYMBOL: 컨트랙트 심볼 (기본값: "GMI")
 * 
 * 수정사항 250902:
 * - ESM 모드와 CommonJS 충돌 해결
 * - import { ethers } from "hardhat" → import hre from "hardhat"로 변경
 */

import hre from "hardhat";
import { ethers } from "hardhat";

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. 배포자 계정 정보 가져오기
 * 2. 배포자 잔액 확인 및 출력
 * 3. 환경변수에서 컨트랙트 이름과 심볼 설정
 * 4. GameItem 컨트랙트 팩토리 가져오기
 * 5. 컨트랙트 배포 실행
 * 6. 배포 완료 대기
 * 7. 배포된 컨트랙트 주소 출력
 */
async function main() {
  // 배포자 계정 정보 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(bal), "AVAX");

  // 환경변수에서 컨트랙트 이름과 심볼 설정 (기본값 제공)
  const name = process.env.NFT_NAME ?? "GameItem";
  const symbol = process.env.NFT_SYMBOL ?? "GMI";

  // GameItem 컨트랙트 팩토리 가져오기
  const GameItem = await ethers.getContractFactory("GameItem");
  
  // 컨트랙트 배포 실행 (이름, 심볼, 초기 소유자)
  const contract = await GameItem.deploy(name, symbol, deployer.address);
  
  // 배포 완료 대기
  await contract.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await contract.getAddress();
  console.log("GameItem deployed to:", address);
  
  // 배포 성공 메시지
  console.log("✅ Deployment completed successfully!");
  console.log("📝 Please update your .env file with:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
