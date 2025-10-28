/**
 * 블록체인 연결 및 컨트랙트 유틸리티
 * 
 * 기능:
 * - 이더리움 네트워크 연결 (Provider 생성)
 * - 지갑 인스턴스 생성 (개인키 기반)
 * - 스마트 컨트랙트 인스턴스 생성
 * 
 * 의존성:
 * - ethers.js: 이더리움 블록체인 상호작용 라이브러리
 * - GameItem.sol: NFT 스마트 컨트랙트 ABI
 */

import { ethers } from "ethers";
import abiJson from "../../../blockchain/artifacts/blockchain/contracts/GameItem.sol/GameItem.json";
import vaultAbiJson from "../../../blockchain/artifacts/blockchain/contracts/NftVault.sol/NftVault.json";

// 환경 변수는 app.ts에서 이미 로드됨 (dotenv.config() 호출)

/**
 * 이더리움 네트워크 Provider 생성
 * 
 * 실행 흐름:
 * 1. 환경변수에서 RPC URL 우선순위로 확인
 * 2. RPC_URL → FUJI_RPC_URL → 기본값(Avalanche 테스트넷)
 * 
 * @returns ethers.JsonRpcProvider - 이더리움 네트워크 연결 객체
 */
export function getProvider(): ethers.JsonRpcProvider {
  // RPC URL 우선순위: RPC_URL > FUJI_RPC_URL > 기본값
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * 지갑 인스턴스 생성
 * 
 * 실행 흐름:
 * 1. 환경변수에서 개인키 확인
 * 2. Provider와 개인키로 지갑 인스턴스 생성
 * 
 * @returns Promise<ethers.Wallet> - 서명 가능한 지갑 인스턴스
 * @throws Error - PRIVATE_KEY 환경변수가 없을 때
 */
export async function getWallet(): Promise<ethers.Wallet> {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY is required");
  return new ethers.Wallet(pk, getProvider());
}

/**
 * 스마트 컨트랙트 인스턴스 생성
 * 
 * 실행 흐름:
 * 1. 환경변수에서 컨트랙트 주소 확인
 * 2. 지갑 인스턴스 생성
 * 3. 컨트랙트 주소, ABI, 지갑으로 컨트랙트 인스턴스 생성
 * 
 * @returns Promise<ethers.Contract> - GameItem 컨트랙트 인스턴스
 * @throws Error - CONTRACT_ADDRESS 환경변수가 없을 때
 */
export async function getContract() {
  console.log('[getContract] 환경변수 디버깅:', {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    NODE_ENV: process.env.NODE_ENV,
    PWD: process.cwd(),
    ENV_KEYS: Object.keys(process.env).filter(key => key.includes('CONTRACT'))
  });
  
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    console.error('[getContract] CONTRACT_ADDRESS가 설정되지 않았습니다.');
    console.error('[getContract] 현재 작업 디렉토리:', process.cwd());
    throw new Error("CONTRACT_ADDRESS is required");
  }
  
  // 지갑 인스턴스 생성 (개인키로 서명 가능)
  const wallet = await getWallet();
  
  // 컨트랙트 인스턴스 생성 (주소, ABI, 지갑)
  return new ethers.Contract(address, abiJson.abi, wallet);
}

/**
 * NFT Vault 컨트랙트 인스턴스 생성
 * 
 * 실행 흐름:
 * 1. 환경변수에서 Vault 컨트랙트 주소 확인
 * 2. 지갑 인스턴스 생성
 * 3. 컨트랙트 주소, ABI, 지갑으로 Vault 컨트랙트 인스턴스 생성
 * 
 * @returns Promise<ethers.Contract> - NftVault 컨트랙트 인스턴스
 * @throws Error - VAULT_ADDRESS 환경변수가 없을 때
 */
export async function getVaultContract() {
  console.log('[getVaultContract] 환경변수 디버깅:', {
    VAULT_ADDRESS: process.env.VAULT_ADDRESS,
    NODE_ENV: process.env.NODE_ENV
  });
  
  const address = process.env.VAULT_ADDRESS;
  if (!address) {
    console.error('[getVaultContract] VAULT_ADDRESS가 설정되지 않았습니다.');
    throw new Error("VAULT_ADDRESS is required");
  }
  
  // 지갑 인스턴스 생성 (개인키로 서명 가능)
  const wallet = await getWallet();
  
  // 컨트랙트 인스턴스 생성 (주소, ABI, 지갑)
  return new ethers.Contract(address, vaultAbiJson.abi, wallet);
}


