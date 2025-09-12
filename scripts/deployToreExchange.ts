/**
 * ToreExchange 배포 스크립트
 * 
 * 기능:
 * - ToreExchange 컨트랙트를 Avalanche 네트워크에 배포
 * - NFT 컨트랙트와 TORE 토큰 컨트랙트 주소 설정
 * - 초기 소유자 설정 및 컨트랙트 정보 출력
 * - 배포자 정보 및 잔액 확인
 * 
 * 사용법:
 * - Fuji 테스트넷: hardhat run scripts/deployToreExchange.ts --network fuji
 * - Avalanche 메인넷: hardhat run scripts/deployToreExchange.ts --network avalanche
 * 
 * 환경변수:
 * - PRIVATE_KEY: 배포자 개인키
 * - NFT_CONTRACT_ADDRESS: NFT 컨트랙트 주소
 * - TORE_TOKEN_ADDRESS: TORE 토큰 컨트랙트 주소
 * - EXCHANGE_OWNER: 거래소 소유자 주소 (기본값: 배포자 주소)
 */

import hre from "hardhat";
import { ethers } from "hardhat";

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. 배포자 계정 정보 가져오기
 * 2. 배포자 잔액 확인 및 출력
 * 3. 필요한 컨트랙트 주소 확인
 * 4. 초기 소유자 주소 설정
 * 5. ToreExchange 컨트랙트 팩토리 가져오기
 * 6. 컨트랙트 배포 실행
 * 7. 배포 완료 대기
 * 8. 배포된 컨트랙트 정보 출력
 * 9. 거래소 설정 정보 출력
 */
async function main() {
  // 배포자 계정 정보 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer:", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");

  // 필요한 컨트랙트 주소 확인
  const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
  const toreTokenAddress = process.env.TORE_TOKEN_ADDRESS;
  
  if (!nftContractAddress) {
    throw new Error("NFT_CONTRACT_ADDRESS environment variable is required");
  }
  
  if (!toreTokenAddress) {
    throw new Error("TORE_TOKEN_ADDRESS environment variable is required");
  }
  
  console.log("📦 NFT Contract:", nftContractAddress);
  console.log("🪙 TORE Token:", toreTokenAddress);

  // 초기 소유자 주소 설정 (환경변수 또는 배포자 주소)
  const initialOwner = process.env.EXCHANGE_OWNER ?? deployer.address;
  console.log("👤 Exchange Owner:", initialOwner);

  // ToreExchange 컨트랙트 팩토리 가져오기
  const ToreExchange = await ethers.getContractFactory("ToreExchange");
  
  // 컨트랙트 배포 실행 (NFT 컨트랙트, TORE 토큰 컨트랙트, 초기 소유자)
  console.log("📦 Deploying ToreExchange...");
  const contract = await ToreExchange.deploy(nftContractAddress, toreTokenAddress, initialOwner);
  
  // 배포 완료 대기
  await contract.waitForDeployment();

  // 배포된 컨트랙트 주소 출력
  const address = await contract.getAddress();
  console.log("✅ ToreExchange deployed to:", address);
  
  // 컨트랙트 정보 확인 및 출력
  const nftContract = await contract.nftContract();
  const toreTokenContract = await contract.toreTokenContract();
  const feePercentage = await contract.feePercentage();
  const totalTrades = await contract.getTotalTrades();
  const activeTradeCount = await contract.getActiveTradeCount();
  
  console.log("\n📊 Exchange Information:");
  console.log("  NFT Contract:", nftContract);
  console.log("  TORE Token Contract:", toreTokenContract);
  console.log("  Fee Percentage:", feePercentage.toString(), "%");
  console.log("  Total Trades:", totalTrades.toString());
  console.log("  Active Trades:", activeTradeCount.toString());
  
  // 네트워크 정보 출력
  const network = await ethers.provider.getNetwork();
  console.log("\n🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");
  
  // 배포 성공 메시지 및 환경변수 설정 안내
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Please update your .env file with:");
  console.log(`TORE_EXCHANGE_ADDRESS=${address}`);
  console.log(`TORE_EXCHANGE_OWNER=${initialOwner}`);
  
  // 거래소 연동을 위한 추가 정보
  console.log("\n🔗 For exchange integration:");
  console.log("  - Users can create trades using createTrade()");
  console.log("  - Users can buy NFTs using buyNFT()");
  console.log("  - Users can cancel trades using cancelTrade()");
  console.log("  - Owner can update fee using updateFee()");
  console.log("  - Owner can update contracts using updateContracts()");
  
  // TORE 토큰 컨트랙트에 거래소 주소 추가 안내
  console.log("\n⚠️  Important: Add exchange contract to TORE token:");
  console.log(`  - Call addExchangeContract(${address}) on TORE token contract`);
  console.log(`  - This allows the exchange to transfer TORE tokens`);
}

// 배포 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
