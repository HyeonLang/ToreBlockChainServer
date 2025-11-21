/**
 * MultiTokenFactory 배포 상태 확인 스크립트
 * 
 * 기능:
 * - MultiTokenFactory 컨트랙트가 실제로 배포되어 있는지 확인
 * - 배포된 컨트랙트의 정보 조회
 * - 토큰 개수 확인
 */

import hre from "hardhat";
const { ethers } = hre as any;

async function main() {
  // 확인할 주소 (기록된 배포 주소)
  const factoryAddress = "0x3E5040bfAea7865D6b78c814b608f400E0AF70E6";
  
  // 네트워크 정보
  const network = await ethers.provider.getNetwork();
  console.log("\n🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");
  
  // 컨트랙트 코드 확인
  const code = await ethers.provider.getCode(factoryAddress);
  
  if (code === "0x") {
    console.log(`❌ MultiTokenFactory가 배포되어 있지 않습니다.`);
    console.log(`주소: ${factoryAddress}`);
    console.log("\n💡 배포하려면 다음 명령어를 실행하세요:");
    console.log("   hardhat run blockchain/scripts/deployMultiTokenFactory.ts --network fuji");
    return;
  }
  
  console.log(`✅ MultiTokenFactory가 배포되어 있습니다!`);
  console.log(`주소: ${factoryAddress}`);
  
  // MultiTokenFactory ABI (필요한 함수만)
  const FACTORY_ABI = [
    "function owner() external view returns (address)",
    "function getTokenCount() external view returns (uint256)",
    "function getAllTokens() external view returns (tuple(string name, string symbol, address contractAddress, uint256 totalSupply, uint8 decimals, address owner, uint256 createdAt, bool isActive)[])"
  ];
  
  try {
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, ethers.provider);
    
    // 소유자 확인
    const owner = await factory.owner();
    console.log(`소유자: ${owner}`);
    
    // 토큰 개수 확인
    const tokenCount = await factory.getTokenCount();
    console.log(`생성된 토큰 개수: ${tokenCount.toString()}`);
    
    // 토큰 목록 조회 (있는 경우)
    if (Number(tokenCount) > 0) {
      const tokens = await factory.getAllTokens();
      console.log("\n📋 생성된 토큰 목록:");
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        console.log(`  ${i + 1}. ${token.name} (${token.symbol})`);
        console.log(`     주소: ${token.contractAddress}`);
        console.log(`     총 공급량: ${ethers.formatUnits(token.totalSupply, token.decimals)}`);
        console.log(`     활성: ${token.isActive ? "예" : "아니오"}`);
        console.log();
      }
    } else {
      console.log("\n📋 생성된 토큰이 없습니다.");
    }
    
    console.log("\n✅ MultiTokenFactory 상태 확인 완료!");
    
  } catch (error: any) {
    console.error("\n❌ 컨트랙트 정보 조회 실패:", error.message);
    console.log("\n⚠️ 주소는 맞지만 컨트랙트가 손상되었거나 다른 컨트랙트일 수 있습니다.");
  }
}

main().catch((err) => {
  console.error("❌ 확인 실패:", err);
  process.exit(1);
});

