/**
 * NFT Vault 배포 스크립트
 * 
 * 기능:
 * - NftVault 컨트랙트를 Avalanche 네트워크에 배포
 * - LOCKUP_OWNER 개인키를 사용하여 배포
 * - NFT 락업/해제 시스템 초기화
 * - 배포자 정보 및 잔액 확인
 * - 배포된 컨트랙트 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run deploy:vault:fuji
 * - Avalanche 메인넷: npm run deploy:vault:avalanche
 * 
 * 환경변수:
 * - LOCKUP_OWNER: 락업 소유자 개인키 (필수)
 * - RPC_URL 또는 FUJI_RPC_URL 또는 AVALANCHE_RPC_URL: 네트워크 RPC URL
 */

import { ethers } from "hardhat";

// hardhat이 이미 dotenv를 로드하므로 별도 import 불필요

/**
 * 메인 배포 함수
 * 
 * 실행 흐름:
 * 1. LOCKUP_OWNER 환경변수에서 개인키 확인
 * 2. 개인키로 지갑 생성 및 네트워크 연결
 * 3. 배포자 잔액 확인 및 출력
 * 4. NftVault 컨트랙트 팩토리 가져오기
 * 5. LOCKUP_OWNER 지갑으로 컨트랙트 배포 실행 (소유자 = LOCKUP_OWNER)
 * 6. 배포 완료 대기
 * 7. 배포된 컨트랙트 주소 출력
 */
async function main() {
  // LOCKUP_OWNER 개인키 확인
  const lockupOwnerPrivateKey = process.env.LOCKUP_OWNER;
  if (!lockupOwnerPrivateKey) {
    throw new Error("❌ LOCKUP_OWNER 환경변수가 설정되지 않았습니다. .env 파일에 LOCKUP_OWNER를 설정해주세요.");
  }

  // 네트워크 정보 가져오기
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // RPC URL 확인 (환경변수 또는 하드햇 설정에서)
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || process.env.AVALANCHE_RPC_URL;
  if (rpcUrl) {
    console.log("🔗 RPC URL:", rpcUrl);
  }

  // LOCKUP_OWNER 개인키로 지갑 생성
  const provider = ethers.provider;
  const deployer = new ethers.Wallet(lockupOwnerPrivateKey, provider);
  
  console.log("👤 Deployer (LOCKUP_OWNER):", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");
  
  if (bal === 0n) {
    console.warn("⚠️  배포자 지갑의 잔액이 0입니다. 배포를 진행하려면 네트워크 토큰이 필요합니다.");
  }

  // NftVault 컨트랙트 팩토리 가져오기
  const NftVault = await ethers.getContractFactory("NftVault");
  
  // 컨트랙트 배포 실행 (LOCKUP_OWNER 지갑으로, 소유자 = LOCKUP_OWNER)
  console.log("\n🚀 배포 시작...");
  const vault = await NftVault.connect(deployer).deploy(deployer.address);
  
  // 배포 완료 대기
  await vault.waitForDeployment();
  
  // 배포된 컨트랙트 주소 출력
  const vaultAddress = await vault.getAddress();
  console.log("\n✅ 배포 완료!");
  console.log("📍 Contract Address:", vaultAddress);
  console.log("👤 Contract Owner:", deployer.address);
  
  // 배포 성공 메시지 및 환경변수 업데이트 안내
  console.log("\n📝 .env 파일에 다음을 추가/수정하세요:");
  console.log(`LOCKUP_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`LOCKUP_OWNER=${lockupOwnerPrivateKey}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

