/**
 * 스마트 컨트랙트 배포 스크립트
 * 
 * 기능:
 * - GameItem NFT 컨트랙트를 Avalanche 네트워크에 배포
 * - NFT_OWNER 개인키를 사용하여 배포
 * - 환경변수에서 컨트랙트 이름과 심볼 설정
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run deploy:fuji
 * - Avalanche 메인넷: npm run deploy:avalanche
 * 
 * 환경변수:
 * - NFT_OWNER: NFT 소유자 개인키 (필수)
 * - NFT_NAME: 컨트랙트 이름 (기본값: "GameItem")
 * - NFT_SYMBOL: 컨트랙트 심볼 (기본값: "GMI")
 * - RPC_URL 또는 FUJI_RPC_URL 또는 AVALANCHE_RPC_URL: 네트워크 RPC URL
 * 
 * 수정사항:
 * - NFT_OWNER 개인키를 사용하여 배포하도록 변경
 * - 배포자와 컨트랙트 소유자를 NFT_OWNER로 통일
 */

import { ethers } from "hardhat";

// hardhat이 이미 dotenv를 로드하므로 별도 import 불필요

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. NFT_OWNER 환경변수에서 개인키 확인
 * 2. 개인키로 지갑 생성 및 네트워크 연결
 * 3. 배포자 잔액 확인 및 출력
 * 4. 환경변수에서 컨트랙트 이름과 심볼 설정
 * 5. GameItem 컨트랙트 팩토리 가져오기
 * 6. NFT_OWNER 지갑으로 컨트랙트 배포 실행
 * 7. 배포 완료 대기
 * 8. 배포된 컨트랙트 주소 출력
 */
async function main() {
  // NFT_OWNER 개인키 확인
  const nftOwnerPrivateKey = process.env.NFT_OWNER;
  if (!nftOwnerPrivateKey) {
    throw new Error("❌ NFT_OWNER 환경변수가 설정되지 않았습니다. .env 파일에 NFT_OWNER를 설정해주세요.");
  }

  // 네트워크 정보 가져오기
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // RPC URL 확인 (환경변수 또는 하드햇 설정에서)
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || process.env.AVALANCHE_RPC_URL;
  if (rpcUrl) {
    console.log("🔗 RPC URL:", rpcUrl);
  }

  // NFT_OWNER 개인키로 지갑 생성
  const provider = ethers.provider;
  const deployer = new ethers.Wallet(nftOwnerPrivateKey, provider);
  
  console.log("👤 Deployer (NFT_OWNER):", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");
  
  if (bal === 0n) {
    console.warn("⚠️  배포자 지갑의 잔액이 0입니다. 배포를 진행하려면 네트워크 토큰이 필요합니다.");
  }

  // 환경변수에서 컨트랙트 이름과 심볼 설정 (기본값 제공)
  const name = process.env.NFT_NAME ?? "GameItem";
  const symbol = process.env.NFT_SYMBOL ?? "GMI";
  
  console.log("📝 Contract Name:", name);
  console.log("📝 Contract Symbol:", symbol);
  console.log("👤 Contract Owner:", deployer.address);

  // GameItem 컨트랙트 팩토리 가져오기 (배포자 지갑 연결)
  const GameItem = await ethers.getContractFactory("GameItem");
  
  // 컨트랙트 배포 실행 (이름, 심볼, 초기 소유자 = NFT_OWNER)
  console.log("\n🚀 배포 시작...");
  const contract = await GameItem.connect(deployer).deploy(name, symbol, deployer.address);
  
  // 배포 완료 대기
  await contract.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await contract.getAddress();
  console.log("\n✅ 배포 완료!");
  console.log("📍 Contract Address:", address);
  console.log("👤 Contract Owner:", deployer.address);
  
  // 배포 성공 메시지 및 환경변수 업데이트 안내
  console.log("\n📝 .env 파일에 다음을 추가/수정하세요:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`NFT_OWNER=${nftOwnerPrivateKey}`);
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
