/**
 * NFT Vault Fuji 테스트넷 테스트 스크립트
 */

import { ethers } from "hardhat";

async function main() {
  console.log("\n=== NFT Vault Fuji 테스트넷 테스트 ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 테스트 계정:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 잔액:", ethers.formatEther(balance), "AVAX\n");

  const nftContractAddress = process.env.CONTRACT_ADDRESS;
  const vaultContractAddress = process.env.VAULT_ADDRESS;

  if (!nftContractAddress || !vaultContractAddress) {
    console.error("❌ 환경변수 설정 필요");
    return;
  }

  console.log("📄 NFT 컨트랙트:", nftContractAddress);
  console.log("🔒 Vault 컨트랙트:", vaultContractAddress);
  console.log("");

  const GameItem = await ethers.getContractFactory("GameItem");
  const nftContract = GameItem.attach(nftContractAddress);

  const Vault = await ethers.getContractFactory("NftVault");
  const vault = Vault.attach(vaultContractAddress);

  // 1. NFT 민팅
  console.log("1️⃣  NFT 민팅 중...");
  const tokenURI = "ipfs://QmTestVault";
  const mintTx = await nftContract.mint(deployer.address, tokenURI);
  const receipt = await mintTx.wait();
  
  // Transfer 이벤트에서 tokenId 추출
  let tokenId: bigint = 0n;
  if (receipt?.logs) {
    for (const log of receipt.logs) {
      try {
        const parsedLog = nftContract.interface.parseLog(log);
        if (parsedLog?.name === 'Transfer') {
          tokenId = parsedLog.args[2] as bigint;
          break;
        }
      } catch {
        // 로그 파싱 실패 시 무시
      }
    }
  }
  
  const tokenIdNum = Number(tokenId);
  console.log("✅ NFT 민팅 완료, tokenId:", tokenIdNum);

  const ownerBeforeLock = await nftContract.ownerOf(tokenId);
  console.log("📦 현재 NFT 소유자:", ownerBeforeLock);

  // 2. Vault에 approve
  console.log("\n2️⃣  Vault에 approve 설정 중...");
  const approveTx = await nftContract.approve(vaultContractAddress, tokenId);
  await approveTx.wait();
  console.log("✅ approve 완료");

  // 3. NFT 락업
  console.log("\n3️⃣  NFT 락업 중...");
  const lockTx = await vault.lockNft(nftContractAddress, tokenId);
  await lockTx.wait();
  console.log("✅ NFT 락업 완료");

  const ownerAfterLock = await nftContract.ownerOf(tokenId);
  console.log("📦 락업 후 NFT 소유자:", ownerAfterLock);

  const vaultedTokens = await vault.getVaultedTokens(deployer.address, nftContractAddress);
  console.log("🔒 Vault에 보관된 NFT:", vaultedTokens);

  // 4. 락업 해제
  console.log("\n4️⃣  NFT 락업 해제 중...");
  const unlockTx = await vault.unlockNft(nftContractAddress, tokenId);
  await unlockTx.wait();
  console.log("✅ NFT 락업 해제 완료");

  const ownerAfterUnlock = await nftContract.ownerOf(tokenId);
  console.log("📦 락업 해제 후 NFT 소유자:", ownerAfterUnlock);

  const vaultedTokensAfter = await vault.getVaultedTokens(deployer.address, nftContractAddress);
  console.log("🔓 락업 해제 후 보관된 NFT:", vaultedTokensAfter);

  console.log("\n=== ✅ 모든 테스트 완료 ===");
  console.log("✅ Vault가 정상적으로 작동합니다!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 테스트 실패:", error);
    process.exit(1);
  });

