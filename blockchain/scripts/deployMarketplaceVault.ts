/**
 * MarketplaceVault 배포 스크립트
 * 
 * 기능:
 * - MarketplaceVault 컨트랙트를 Avalanche 네트워크에 배포
 * - MARKET_OWNER 개인키를 사용하여 배포
 * - NFT 마켓플레이스 보관소 초기화
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run deploy:marketplace-vault:fuji
 * - Avalanche 메인넷: npm run deploy:marketplace-vault:avalanche
 * 
 * 환경변수 (필수):
 * - MARKET_OWNER: 마켓 소유자 개인키 (필수)
 * - CONTRACT_ADDRESS: NFT 컨트랙트 주소 (ERC721)
 * - TORE_TOKEN_ADDRESS: 결제 토큰 주소 (ERC20)
 * 
 * 환경변수 (선택):
 * - PLATFORM_FEE_PERCENT: 플랫폼 수수료율 (10000 = 100%, 기본값: 250 = 2.5%)
 * - RPC_URL 또는 FUJI_RPC_URL 또는 AVALANCHE_RPC_URL: 네트워크 RPC URL
 */

import { ethers } from "hardhat";

// hardhat이 이미 dotenv를 로드하므로 별도 import 불필요

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. MARKET_OWNER 환경변수에서 개인키 확인
 * 2. 개인키로 지갑 생성 및 네트워크 연결
 * 3. 배포자 잔액 확인 및 출력
 * 4. 필수 환경변수 확인 (CONTRACT_ADDRESS, TORE_TOKEN_ADDRESS)
 * 5. MarketplaceVault 컨트랙트 팩토리 가져오기
 * 6. MARKET_OWNER 지갑으로 컨트랙트 배포 실행
 * 7. 배포 완료 대기
 * 8. 배포된 컨트랙트 주소 출력
 */
async function main() {
  // MARKET_OWNER 개인키 확인
  const marketOwnerPrivateKey = process.env.MARKET_OWNER;
  if (!marketOwnerPrivateKey) {
    throw new Error("❌ MARKET_OWNER 환경변수가 설정되지 않았습니다. .env 파일에 MARKET_OWNER를 설정해주세요.");
  }

  // 네트워크 정보 가져오기
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // RPC URL 확인 (환경변수 또는 하드햇 설정에서)
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || process.env.AVALANCHE_RPC_URL;
  if (rpcUrl) {
    console.log("🔗 RPC URL:", rpcUrl);
  }

  // MARKET_OWNER 개인키로 지갑 생성
  const provider = ethers.provider;
  const deployer = new ethers.Wallet(marketOwnerPrivateKey, provider);
  
  console.log("👤 Deployer (MARKET_OWNER):", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");
  
  if (bal === 0n) {
    console.warn("⚠️  배포자 지갑의 잔액이 0입니다. 배포를 진행하려면 네트워크 토큰이 필요합니다.");
  }

  // 환경변수에서 필요한 주소 가져오기
  const nftAddress = process.env.CONTRACT_ADDRESS;
  if (!nftAddress) {
    throw new Error("❌ CONTRACT_ADDRESS 환경변수가 필요합니다. NFT 컨트랙트 주소를 설정하세요.");
  }
  console.log("\n📦 NFT Contract Address:", nftAddress);

  // 결제 토큰 주소 가져오기 (TORE_TOKEN_ADDRESS는 토큰 주소, MULTI_TOKEN_FACTORY_ADDRESS는 팩토리 컨트랙트 주소이므로 TORE_TOKEN_ADDRESS만 사용)
  const tokenAddress = process.env.TORE_TOKEN_ADDRESS;
  if (!tokenAddress) {
    throw new Error("❌ TORE_TOKEN_ADDRESS 환경변수가 필요합니다. 결제 토큰 주소를 설정하세요.");
  }
  console.log("💰 Payment Token Address:", tokenAddress);

  // 수수료 수령자 주소 (MARKET_OWNER 주소로 설정)
  const feeCollector = deployer.address;
  console.log("💵 Fee Collector:", feeCollector);

  // 플랫폼 수수료율 (기본값: 250 = 2.5%)
  const feePercent = process.env.PLATFORM_FEE_PERCENT 
    ? parseInt(process.env.PLATFORM_FEE_PERCENT) 
    : 250;
  console.log("📊 Platform Fee:", feePercent / 100, "% (", feePercent, "/ 10000 )");

  // MarketplaceVault 컨트랙트 팩토리 가져오기
  const MarketplaceVault = await ethers.getContractFactory("MarketplaceVault");
  
  // 컨트랙트 배포 실행 (MARKET_OWNER 지갑으로)
  console.log("\n🚀 배포 시작...");
  console.log("   NFT Address:", nftAddress);
  console.log("   Token Address:", tokenAddress);
  console.log("   Fee Collector:", feeCollector);
  console.log("   Fee Percent:", feePercent);
  
  const vault = await MarketplaceVault.connect(deployer).deploy(
    nftAddress,
    tokenAddress,
    feeCollector,
    feePercent
  );
  
  // 배포 완료 대기
  await vault.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await vault.getAddress();
  console.log("\n✅ 배포 완료!");
  console.log("📍 Contract Address:", address);
  console.log("👤 Contract Owner:", deployer.address);
  console.log("💵 Fee Collector:", feeCollector);
  
  // 배포 성공 메시지 및 환경변수 업데이트 안내
  console.log("\n📝 .env 파일에 다음을 추가/수정하세요:");
  console.log(`MARKETPLACE_VAULT_ADDRESS=${address}`);
  console.log(`MARKET_OWNER=${marketOwnerPrivateKey}`);
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});

