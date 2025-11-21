/**
 * 토큰 생성 스크립트
 * 
 * 기능:
 * - MultiTokenFactory를 사용하여 새 토큰 생성
 * - TOKEN_OWNER 개인키를 사용하여 토큰 생성
 * - 생성된 토큰 주소 출력
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run create:token:fuji
 * - Avalanche 메인넷: npm run create:token:avalanche
 * 
 * 환경변수 (필수):
 * - TOKEN_OWNER: 토큰 소유자 개인키 (필수)
 * - MULTI_TOKEN_FACTORY_ADDRESS: 토큰 팩토리 주소 (필수)
 * 
 * 환경변수 (선택):
 * - TOKEN_NAME: 토큰 이름 (기본값: "TORETOKEN")
 * - TOKEN_SYMBOL: 토큰 심볼 (기본값: "TORE")
 * - TOKEN_DECIMALS: 소수점 자릿수 (기본값: 18)
 * - TOKEN_INITIAL_SUPPLY: 초기 공급량 (기본값: "1000000000")
 */

import { ethers } from "hardhat";

// hardhat이 이미 dotenv를 로드하므로 별도 import 불필요

/**
 * MultiTokenFactory ABI (createToken 함수)
 */
const FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply, address tokenOwner) external returns (address)",
  "function getTokenBySymbol(string memory symbol) external view returns (tuple(string name, string symbol, address contractAddress, uint256 totalSupply, uint8 decimals, address owner, uint256 createdAt, bool isActive))"
];

async function main() {
  // 환경변수 디버깅
  console.log("[Debug] 환경변수 확인:", {
    TOKEN_OWNER: process.env.TOKEN_OWNER ? "설정됨" : "설정안됨",
    MULTI_TOKEN_FACTORY_ADDRESS: process.env.MULTI_TOKEN_FACTORY_ADDRESS || "설정안됨",
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || "설정안됨"
  });

  // TOKEN_OWNER 개인키 확인
  const tokenOwnerPrivateKey = process.env.TOKEN_OWNER;
  if (!tokenOwnerPrivateKey) {
    throw new Error("❌ TOKEN_OWNER 환경변수가 설정되지 않았습니다. .env 파일에 TOKEN_OWNER를 설정해주세요.");
  }

  // MULTI_TOKEN_FACTORY_ADDRESS 확인
  const factoryAddress = process.env.MULTI_TOKEN_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("❌ MULTI_TOKEN_FACTORY_ADDRESS 환경변수가 설정되지 않았습니다. .env 파일에 MULTI_TOKEN_FACTORY_ADDRESS를 설정해주세요.");
  }

  // 네트워크 정보 가져오기
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // TOKEN_OWNER 개인키로 지갑 생성
  const provider = ethers.provider;
  const deployer = new ethers.Wallet(tokenOwnerPrivateKey, provider);
  
  console.log("👤 Token Owner (TOKEN_OWNER):", deployer.address);

  // 배포자 잔액 확인 및 출력
  const bal = await provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(bal), "AVAX");
  
  if (bal === 0n) {
    console.warn("⚠️  지갑의 잔액이 0입니다. 토큰 생성을 진행하려면 네트워크 토큰이 필요합니다.");
  }

  // 토큰 정보 설정
  const tokenName = process.env.TOKEN_NAME || "TORETOKEN";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "TORE";
  const tokenDecimals = process.env.TOKEN_DECIMALS ? parseInt(process.env.TOKEN_DECIMALS) : 18;
  const initialSupply = process.env.TOKEN_INITIAL_SUPPLY || "1000000000"; // 10억 토큰

  console.log("\n📝 토큰 정보:");
  console.log("   Name:", tokenName);
  console.log("   Symbol:", tokenSymbol);
  console.log("   Decimals:", tokenDecimals);
  console.log("   Initial Supply:", initialSupply);

  // MultiTokenFactory 컨트랙트 인스턴스 생성
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, deployer);
  
  // 초기 공급량을 wei 단위로 변환
  const initialSupplyWei = ethers.parseUnits(initialSupply, tokenDecimals);

  // 토큰 생성
  console.log("\n🚀 토큰 생성 시작...");
  const tx = await factory.createToken(
    tokenName,
    tokenSymbol,
    tokenDecimals,
    initialSupplyWei,
    deployer.address // 토큰 소유자 = TOKEN_OWNER
  );
  
  console.log("📤 트랜잭션 전송:", tx.hash);
  
  // 트랜잭션 완료 대기
  const receipt = await tx.wait();
  console.log("✅ 트랜잭션 확인 완료");

  // 생성된 토큰 주소 조회
  const tokenInfo = await factory.getTokenBySymbol(tokenSymbol);
  const tokenAddress = tokenInfo.contractAddress;

  console.log("\n✅ 토큰 생성 완료!");
  console.log("📍 Token Address:", tokenAddress);
  console.log("👤 Token Owner:", deployer.address);
  console.log("📊 Total Supply:", ethers.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals), tokenSymbol);
  
  // 환경변수 업데이트 안내
  console.log("\n📝 .env 파일에 다음을 추가/수정하세요:");
  console.log(`TORE_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`# 또는 MARKETPLACE_PAYMENT_TOKEN_ADDRESS=${tokenAddress}`);
}

// 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Token creation failed:", err);
  process.exit(1);
});

