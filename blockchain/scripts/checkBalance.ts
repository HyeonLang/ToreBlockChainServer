/**
 * ToreTest 토큰 잔액 확인 스크립트
 * 
 * 기능:
 * - 배포된 ToreTest 토큰의 잔액 확인
 * - 토큰 정보 출력
 */

import hre from "hardhat";
const { ethers } = hre as any;

async function main() {
  // 토큰 컨트랙트 주소
  const tokenAddress = "0xa33D0f029Db6bE758df1A429C70C4B4e9873756b";
  
  // 확인할 지갑 주소들
  const addresses = [
    "0x554c97115b5FFf04a05C4e28eb564eeD139fdfC5", // 배포자
    "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // 다른 테스트 주소
    "0x1234567890123456789012345678901234567890"   // 더미 주소
  ];

  // 토큰 컨트랙트 연결
  const ToreToken = await ethers.getContractFactory("ToreToken");
  const tokenContract = ToreToken.attach(tokenAddress);

  console.log("📊 ToreTest Token Information:");
  console.log("  Contract Address:", tokenAddress);
  console.log("  Token Name:", await tokenContract.name());
  console.log("  Token Symbol:", await tokenContract.symbol());
  console.log("  Decimals:", await tokenContract.decimals());
  console.log("  Total Supply:", ethers.formatUnits(await tokenContract.totalSupply(), 18), "TORE");
  
  console.log("\n💰 Token Balances:");
  for (const address of addresses) {
    const balance = await tokenContract.balanceOf(address);
    console.log(`  ${address}: ${ethers.formatUnits(balance, 18)} TORE`);
  }
  
  console.log("\n🌐 Network: Avalanche Fuji Testnet (Chain ID: 43113)");
}

// 스크립트 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Balance check failed:", err);
  process.exit(1);
});
