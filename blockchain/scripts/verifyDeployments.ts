/**
 * 배포된 컨트랙트 검증 스크립트
 * 
 * 기능:
 * - 배포된 모든 컨트랙트의 기본 정보 조회
 * - 컨트랙트 소유자 확인
 * - 컨트랙트 상태 확인
 * 
 * 사용법:
 * - Fuji 테스트넷: npm run verify:fuji
 * - Avalanche 메인넷: npm run verify:avalanche
 */

import { ethers } from "hardhat";

// ERC721 기본 ABI
const ERC721_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function owner() external view returns (address)",
  "function totalSupply() external view returns (uint256)"
];

// ERC20 기본 ABI
const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function owner() external view returns (address)"
];

// Ownable ABI
const OWNABLE_ABI = [
  "function owner() external view returns (address)"
];

// MultiTokenFactory ABI
const FACTORY_ABI = [
  "function owner() external view returns (address)",
  "function getTokenCount() external view returns (uint256)"
];

// MarketplaceVault ABI
const MARKETPLACE_ABI = [
  "function owner() external view returns (address)",
  "function nftContract() external view returns (address)",
  "function paymentToken() external view returns (address)",
  "function feeCollector() external view returns (address)",
  "function platformFeePercent() external view returns (uint256)"
];

async function main() {
  console.log("\n=== 배포된 컨트랙트 검증 시작 ===\n");

  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})\n`);

  // 환경변수에서 컨트랙트 주소 가져오기
  const nftAddress = process.env.CONTRACT_ADDRESS;
  const factoryAddress = process.env.MULTI_TOKEN_FACTORY_ADDRESS;
  const tokenAddress = process.env.TORE_TOKEN_ADDRESS;
  const lockupVaultAddress = process.env.LOCKUP_VAULT_ADDRESS;
  const marketplaceVaultAddress = process.env.MARKETPLACE_VAULT_ADDRESS;

  // 1. NFT 컨트랙트 검증
  if (nftAddress) {
    console.log("1️⃣  NFT 컨트랙트 (GameItem)");
    console.log("   주소:", nftAddress);
    try {
      const nftContract = new ethers.Contract(nftAddress, ERC721_ABI, provider);
      const name = await nftContract.name();
      const symbol = await nftContract.symbol();
      const owner = await nftContract.owner();
      const totalSupply = await nftContract.totalSupply();
      console.log("   ✅ 이름:", name);
      console.log("   ✅ 심볼:", symbol);
      console.log("   ✅ 소유자:", owner);
      console.log("   ✅ 총 발행량:", totalSupply.toString());
    } catch (error: any) {
      console.log("   ❌ 오류:", error.message);
    }
    console.log("");
  } else {
    console.log("1️⃣  NFT 컨트랙트: ❌ CONTRACT_ADDRESS가 설정되지 않음\n");
  }

  // 2. MultiTokenFactory 검증
  if (factoryAddress) {
    console.log("2️⃣  MultiTokenFactory");
    console.log("   주소:", factoryAddress);
    try {
      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
      const owner = await factory.owner();
      const tokenCount = await factory.getTokenCount();
      console.log("   ✅ 소유자:", owner);
      console.log("   ✅ 생성된 토큰 수:", tokenCount.toString());
    } catch (error: any) {
      console.log("   ❌ 오류:", error.message);
    }
    console.log("");
  } else {
    console.log("2️⃣  MultiTokenFactory: ❌ MULTI_TOKEN_FACTORY_ADDRESS가 설정되지 않음\n");
  }

  // 3. TORE 토큰 검증
  if (tokenAddress) {
    console.log("3️⃣  TORE 토큰");
    console.log("   주소:", tokenAddress);
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const totalSupply = await tokenContract.totalSupply();
      const owner = await tokenContract.owner();
      console.log("   ✅ 이름:", name);
      console.log("   ✅ 심볼:", symbol);
      console.log("   ✅ 소수점:", decimals);
      console.log("   ✅ 총 공급량:", ethers.formatUnits(totalSupply, decimals), symbol);
      console.log("   ✅ 소유자:", owner);
    } catch (error: any) {
      console.log("   ❌ 오류:", error.message);
    }
    console.log("");
  } else {
    console.log("3️⃣  TORE 토큰: ❌ TORE_TOKEN_ADDRESS가 설정되지 않음\n");
  }

  // 4. Lockup Vault 검증
  if (lockupVaultAddress) {
    console.log("4️⃣  Lockup Vault (NftVault)");
    console.log("   주소:", lockupVaultAddress);
    try {
      const vault = new ethers.Contract(lockupVaultAddress, OWNABLE_ABI, provider);
      const owner = await vault.owner();
      console.log("   ✅ 소유자:", owner);
      // 코드가 배포되어 있는지 확인
      const code = await provider.getCode(lockupVaultAddress);
      if (code === "0x") {
        console.log("   ❌ 컨트랙트 코드가 없습니다 (배포되지 않음)");
      } else {
        console.log("   ✅ 컨트랙트 코드 확인됨");
      }
    } catch (error: any) {
      console.log("   ❌ 오류:", error.message);
    }
    console.log("");
  } else {
    console.log("4️⃣  Lockup Vault: ❌ LOCKUP_VAULT_ADDRESS가 설정되지 않음\n");
  }

  // 5. MarketplaceVault 검증
  if (marketplaceVaultAddress) {
    console.log("5️⃣  MarketplaceVault");
    console.log("   주소:", marketplaceVaultAddress);
    try {
      const marketplace = new ethers.Contract(marketplaceVaultAddress, MARKETPLACE_ABI, provider);
      const owner = await marketplace.owner();
      const nftContract = await marketplace.nftContract();
      const paymentToken = await marketplace.paymentToken();
      const feeCollector = await marketplace.feeCollector();
      const feePercent = await marketplace.platformFeePercent();
      console.log("   ✅ 소유자:", owner);
      console.log("   ✅ NFT 컨트랙트:", nftContract);
      console.log("   ✅ 결제 토큰:", paymentToken);
      console.log("   ✅ 수수료 수령자:", feeCollector);
      console.log("   ✅ 플랫폼 수수료:", Number(feePercent) / 100, "%");
      // 코드가 배포되어 있는지 확인
      const code = await provider.getCode(marketplaceVaultAddress);
      if (code === "0x") {
        console.log("   ❌ 컨트랙트 코드가 없습니다 (배포되지 않음)");
      } else {
        console.log("   ✅ 컨트랙트 코드 확인됨");
      }
    } catch (error: any) {
      console.log("   ❌ 오류:", error.message);
    }
    console.log("");
  } else {
    console.log("5️⃣  MarketplaceVault: ❌ MARKETPLACE_VAULT_ADDRESS가 설정되지 않음\n");
  }

  // 소유자 지갑 주소 확인
  console.log("📝 환경변수에서 설정된 소유자 지갑:");
  if (process.env.NFT_OWNER) {
    const nftWallet = new ethers.Wallet(process.env.NFT_OWNER, provider);
    console.log("   NFT_OWNER:", nftWallet.address);
  }
  if (process.env.TOKEN_OWNER) {
    const tokenWallet = new ethers.Wallet(process.env.TOKEN_OWNER, provider);
    console.log("   TOKEN_OWNER:", tokenWallet.address);
  }
  if (process.env.LOCKUP_OWNER) {
    const lockupWallet = new ethers.Wallet(process.env.LOCKUP_OWNER, provider);
    console.log("   LOCKUP_OWNER:", lockupWallet.address);
  }
  if (process.env.MARKET_OWNER) {
    const marketWallet = new ethers.Wallet(process.env.MARKET_OWNER, provider);
    console.log("   MARKET_OWNER:", marketWallet.address);
  }

  console.log("\n=== 검증 완료 ===\n");
}

main().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

