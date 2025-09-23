/**
 * ToreTest 토큰 전송 스크립트
 * 
 * 기능:
 * - 배포된 ToreTest 토큰을 지정된 지갑으로 전송
 * - 토큰 잔액 확인
 * - 전송 결과 확인
 */

import hre from "hardhat";
const { ethers } = hre as any;

async function main() {
  // 배포자 계정 정보 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer:", deployer.address);

  // 토큰 컨트랙트 주소
  const tokenAddress = "0xa33D0f029Db6bE758df1A429C70C4B4e9873756b";
  
  // 전송할 지갑 주소
  const recipientAddress = "0x554c97115b5FFf04a05C4e28eb564eeD139fdfC5";
  
  // 전송할 토큰 양 (1000 TORE)
  const transferAmount = ethers.parseUnits("1000", 18);

  // 토큰 컨트랙트 연결
  const ToreToken = await ethers.getContractFactory("ToreToken");
  const tokenContract = ToreToken.attach(tokenAddress);

  console.log("\n📊 Before Transfer:");
  console.log("  Token Address:", tokenAddress);
  console.log("  Token Name:", await tokenContract.name());
  console.log("  Token Symbol:", await tokenContract.symbol());
  
  // 현재 잔액 확인
  const deployerBalance = await tokenContract.balanceOf(deployer.address);
  const recipientBalance = await tokenContract.balanceOf(recipientAddress);
  
  console.log("  Deployer Balance:", ethers.formatUnits(deployerBalance, 18), "TORE");
  console.log("  Recipient Balance:", ethers.formatUnits(recipientBalance, 18), "TORE");

  // 토큰 전송 실행
  console.log("\n💸 Transferring 1000 TORE to recipient...");
  const tx = await tokenContract.transfer(recipientAddress, transferAmount);
  console.log("  Transaction Hash:", tx.hash);
  
  // 트랜잭션 완료 대기
  await tx.wait();
  console.log("  ✅ Transfer completed!");

  // 전송 후 잔액 확인
  console.log("\n📊 After Transfer:");
  const newDeployerBalance = await tokenContract.balanceOf(deployer.address);
  const newRecipientBalance = await tokenContract.balanceOf(recipientAddress);
  
  console.log("  Deployer Balance:", ethers.formatUnits(newDeployerBalance, 18), "TORE");
  console.log("  Recipient Balance:", ethers.formatUnits(newRecipientBalance, 18), "TORE");
  
  console.log("\n🎉 Token transfer completed successfully!");
  console.log("📝 Transaction Details:");
  console.log("  From:", deployer.address);
  console.log("  To:", recipientAddress);
  console.log("  Amount: 1000 TORE");
  console.log("  Token Contract:", tokenAddress);
  console.log("  Network: Avalanche Fuji Testnet");
}

// 스크립트 실행 및 에러 처리
main().catch((err) => {
  console.error("❌ Transfer failed:", err);
  process.exit(1);
});
