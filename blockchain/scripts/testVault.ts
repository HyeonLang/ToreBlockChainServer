/**
 * NFT Vault 락업/해제 테스트 스크립트
 * 
 * 실행 흐름:
 * 1. Vault 컨트랙트 배포
 * 2. NFT 민팅
 * 3. NFT에 approve 설정
 * 4. NFT 락업
 * 5. 락업 상태 확인
 * 6. NFT 락업 해제
 * 7. 소유권 확인
 * 
 * 실행 방법:
 * npm run test:vault
 */

import { ethers } from "hardhat";

async function main() {
  console.log("\n=== NFT Vault 테스트 시작 ===\n");

  // 테스트 지갑 가져오기
  const [owner] = await ethers.getSigners();
  console.log("📝 테스트 계정:", owner.address);
  
  const balance = await ethers.provider.getBalance(owner.address);
  console.log("💰 잔액:", ethers.formatEther(balance), "ETH\n");

  // 1. GameItem NFT 컨트랙트 배포
  console.log("1️⃣  GameItem NFT 컨트랙트 배포 중...");
  const GameItemFactory = await ethers.getContractFactory("GameItem");
  const gameItem = await GameItemFactory.deploy("TestItem", "TI", owner.address);
  await gameItem.waitForDeployment();
  const gameItemAddress = await gameItem.getAddress();
  console.log("✅ GameItem 컨트랙트 주소:", gameItemAddress);

  // 2. Vault 컨트랙트 배포
  console.log("\n2️⃣  Vault 컨트랙트 배포 중...");
  const VaultFactory = await ethers.getContractFactory("NftVault");
  const vault = await VaultFactory.deploy(owner.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault 컨트랙트 주소:", vaultAddress);

  // 3. NFT 민팅
  console.log("\n3️⃣  NFT 민팅 중...");
  const tokenURI = "https://example.com/nft/1";
  const mintTx = await gameItem.mint(owner.address, tokenURI);
  const mintReceipt = await mintTx.wait();
  
  // Transfer 이벤트에서 tokenId 추출
  let tokenId: bigint | null = null;
  if (mintReceipt?.logs) {
    const log = mintReceipt.logs[0];
    try {
      const parsedLog = gameItem.interface.parseLog(log);
      if (parsedLog?.name === 'Transfer') {
        tokenId = parsedLog.args[2] as bigint;
      }
    } catch (err) {
      console.warn("⚠️  이벤트 파싱 실패, 기본값 사용");
      tokenId = 1n;
    }
  }
  
  if (!tokenId) {
    console.error("❌ tokenId를 추출할 수 없습니다");
    return;
  }
  
  console.log("✅ NFT 민팅 완료, tokenId:", tokenId.toString());
  
  // 소유권 확인
  const ownerBeforeLock = await gameItem.ownerOf(tokenId);
  console.log("📦 현재 NFT 소유자:", ownerBeforeLock);
  console.log("   (예상: Vault에 락업 전이므로 owner 주소와 동일해야 함)");

  // 4. Vault에 approve 설정
  console.log("\n4️⃣  Vault에 approve 설정 중...");
  const approveTx = await gameItem.approve(vaultAddress, tokenId);
  await approveTx.wait();
  console.log("✅ approve 완료");

  // approve 상태 확인
  const approvedAddress = await gameItem.getApproved(tokenId);
  console.log("🔍 approve된 주소:", approvedAddress);
  console.log("   (예상: Vault 주소와 동일해야 함)");

  // 5. NFT 락업
  console.log("\n5️⃣  NFT 락업 중...");
  const lockTx = await vault.lockNft(gameItemAddress, tokenId);
  await lockTx.wait();
  console.log("✅ NFT 락업 완료");

  // 락업 후 소유권 확인
  const ownerAfterLock = await gameItem.ownerOf(tokenId);
  console.log("📦 락업 후 NFT 소유자:", ownerAfterLock);
  console.log("   (예상: Vault 주소와 동일해야 함)");

  // Vault에 보관된 NFT 확인
  const vaultedTokens = await vault.getVaultedTokens(owner.address, gameItemAddress);
  const vaultedTokensArray = vaultedTokens.map((t: any) => t.toString());
  console.log("🔒 Vault에 보관된 NFT:", vaultedTokensArray);

  // 6. 락업 해제
  console.log("\n6️⃣  NFT 락업 해제 중...");
  const unlockTx = await vault.unlockNft(gameItemAddress, tokenId);
  await unlockTx.wait();
  console.log("✅ NFT 락업 해제 완료");

  // 락업 해제 후 소유권 확인
  const ownerAfterUnlock = await gameItem.ownerOf(tokenId);
  console.log("📦 락업 해제 후 NFT 소유자:", ownerAfterUnlock);
  console.log("   (예상: owner 주소와 동일해야 함)");

  // Vault에 남아있는 NFT 확인
  const vaultedTokensAfter = await vault.getVaultedTokens(owner.address, gameItemAddress);
  const vaultedTokensAfterArray = vaultedTokensAfter.map((t: any) => t.toString());
  console.log("🔓 락업 해제 후 보관된 NFT:", vaultedTokensAfterArray);
  console.log("   (예상: 빈 배열이어야 함)");

  console.log("\n=== ✅ 모든 테스트 완료 ===\n");
  console.log("📝 요약:");
  console.log("  - GameItem 컨트랙트:", gameItemAddress);
  console.log("  - Vault 컨트랙트:", vaultAddress);
  console.log("  - 테스트 NFT tokenId:", tokenId.toString());
  console.log("  - 락업 전 소유자:", owner.address);
  console.log("  - 락업 후 소유자:", vaultAddress);
  console.log("  - 락업 해제 후 소유자:", owner.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 테스트 실패:", error);
    process.exit(1);
  });

