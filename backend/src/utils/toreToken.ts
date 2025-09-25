/**
 * ToreToken 컨트랙트 연동 유틸리티
 * 
 * 기능:
 * - ToreToken ERC-20 컨트랙트 연결 및 상호작용
 * - 토큰 잔액 조회, 전송, 게임 보상 지급
 * - 게임 컨트랙트 및 매니저 관리
 * - 배치 전송 및 토큰 정보 조회
 * - NFT 거래 지원
 * 
 * 의존성:
 * - ethers.js: 이더리움 블록체인 상호작용 라이브러리
 * - ToreToken.sol: ERC-20 토큰 스마트 컨트랙트 ABI
 * 
 * 지원 기능:
 * - 토큰 잔액 조회
 * - 토큰 전송
 * - 게임 보상 지급
 * - 배치 전송
 * - 게임 컨트랙트/매니저 관리
 * - NFT 거래 지원
 */

import { ethers } from "ethers";
import dotenv from "dotenv";
import abiJson from "../../../blockchain/artifacts/blockchain/contracts/ToreToken.sol/ToreToken.json";

// 환경 변수 로드
dotenv.config();

/**
 * ToreToken 컨트랙트 인스턴스 생성
 * 
 * 실행 흐름:
 * 1. 환경변수에서 ToreToken 컨트랙트 주소 확인
 * 2. Provider 생성
 * 3. 컨트랙트 인스턴스 생성
 * 4. 컨트랙트 연결 확인
 * 
 * @returns Promise<ethers.Contract> - ToreToken 컨트랙트 인스턴스
 * @throws Error - TORE_TOKEN_ADDRESS 환경변수가 없을 때
 * @throws Error - 컨트랙트 연결 실패 시
 */
export async function getToreTokenContract() {
  const address = process.env.TORE_TOKEN_ADDRESS;
  if (!address) {
    throw new Error("TORE_TOKEN_ADDRESS is required. Please set TORE_TOKEN_ADDRESS environment variable.");
  }
  
  console.log(`[ToreToken] Contract address: ${address}`);
  
  // Provider 생성
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // 컨트랙트 인스턴스 생성 (읽기 전용)
  const contract = new ethers.Contract(address, abiJson.abi, provider);
  
  try {
    // 컨트랙트 연결 확인 (name() 함수 호출)
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`[ToreToken] Connected to contract: ${name} (${symbol})`);
  } catch (error) {
    console.error('[ToreToken] Failed to connect to contract:', error);
    throw new Error(`Failed to connect to ToreToken contract at ${address}: ${error}`);
  }
  
  return contract;
}

/**
 * ToreToken 컨트랙트 인스턴스 생성 (서명 가능)
 * 
 * 실행 흐름:
 * 1. 환경변수에서 ToreToken 컨트랙트 주소 확인
 * 2. 지갑 인스턴스 생성 (개인키 기반)
 * 3. 컨트랙트 인스턴스 생성
 * 4. 컨트랙트 연결 확인
 * 
 * @returns Promise<ethers.Contract> - 서명 가능한 ToreToken 컨트랙트 인스턴스
 * @throws Error - TORE_TOKEN_ADDRESS 환경변수가 없을 때
 * @throws Error - PRIVATE_KEY 환경변수가 없을 때
 * @throws Error - 컨트랙트 연결 실패 시
 */
export async function getToreTokenContractWithWallet() {
  const address = process.env.TORE_TOKEN_ADDRESS;
  if (!address) {
    throw new Error("TORE_TOKEN_ADDRESS is required. Please set TORE_TOKEN_ADDRESS environment variable.");
  }
  
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY is required. Please set PRIVATE_KEY environment variable.");
  }
  
  console.log(`[ToreToken] Contract address: ${address}`);
  
  // Provider 생성
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // 지갑 인스턴스 생성 (개인키로 서명 가능)
  const wallet = new ethers.Wallet(pk, provider);
  
  // 컨트랙트 인스턴스 생성 (주소, ABI, 지갑)
  const contract = new ethers.Contract(address, abiJson.abi, wallet);
  
  try {
    // 컨트랙트 연결 확인 (name() 함수 호출)
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`[ToreToken] Connected to contract: ${name} (${symbol})`);
  } catch (error) {
    console.error('[ToreToken] Failed to connect to contract:', error);
    throw new Error(`Failed to connect to ToreToken contract at ${address}: ${error}`);
  }
  
  return contract;
}

/**
 * 토큰 잔액 조회
 * 
 * @param address - 조회할 주소
 * @returns Promise<string> - 포맷된 토큰 잔액
 */
export async function getTokenBalance(address: string): Promise<string> {
  try {
    const contract = await getToreTokenContract();
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('[ToreToken] Failed to get balance:', error);
    throw error;
  }
}

/**
 * 토큰 전송
 * 
 * @param to - 받을 주소
 * @param amount - 전송할 토큰 양 (문자열 형태)
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function transferTokens(to: string, amount: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(to, amountWei);
    await tx.wait();
    
    console.log(`[ToreToken] Transfer completed: ${amount} TORE to ${to}`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to transfer tokens:', error);
    throw error;
  }
}

/**
 * 게임 보상 지급
 * 
 * @param player - 보상을 받을 플레이어 주소
 * @param amount - 지급할 토큰 양 (문자열 형태)
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function distributeGameReward(player: string, amount: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.distributeGameReward(player, amountWei);
    await tx.wait();
    
    console.log(`[ToreToken] Game reward distributed: ${amount} TORE to ${player}`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to distribute game reward:', error);
    throw error;
  }
}

/**
 * 배치 전송
 * 
 * @param recipients - 받을 주소들의 배열
 * @param amounts - 각 주소가 받을 토큰 양의 배열 (문자열 형태)
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function batchTransfer(recipients: string[], amounts: string[]): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    const decimals = await contract.decimals();
    
    // 문자열 배열을 Wei 단위로 변환
    const amountsWei = amounts.map(amount => ethers.parseUnits(amount, decimals));
    
    const tx = await contract.batchTransfer(recipients, amountsWei);
    await tx.wait();
    
    console.log(`[ToreToken] Batch transfer completed: ${recipients.length} recipients`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to batch transfer:', error);
    throw error;
  }
}

/**
 * 게임 컨트랙트 추가
 * 
 * @param contractAddress - 추가할 게임 컨트랙트 주소
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function addGameContract(contractAddress: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    
    const tx = await contract.addGameContract(contractAddress);
    await tx.wait();
    
    console.log(`[ToreToken] Game contract added: ${contractAddress}`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to add game contract:', error);
    throw error;
  }
}

/**
 * 게임 매니저 추가
 * 
 * @param managerAddress - 추가할 게임 매니저 주소
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function addGameManager(managerAddress: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    
    const tx = await contract.addGameManager(managerAddress);
    await tx.wait();
    
    console.log(`[ToreToken] Game manager added: ${managerAddress}`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to add game manager:', error);
    throw error;
  }
}


/**
 * 토큰 민팅
 * 
 * @param to - 토큰을 받을 주소
 * @param amount - 민팅할 토큰 양 (문자열 형태)
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function mintTokens(to: string, amount: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.mint(to, amountWei);
    await tx.wait();
    
    console.log(`[ToreToken] Tokens minted: ${amount} TORE to ${to}`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to mint tokens:', error);
    throw error;
  }
}

/**
 * 토큰 소각
 * 
 * @param amount - 소각할 토큰 양 (문자열 형태)
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function burnTokens(amount: string): Promise<string> {
  try {
    const contract = await getToreTokenContractWithWallet();
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.burn(amountWei);
    await tx.wait();
    
    console.log(`[ToreToken] Tokens burned: ${amount} TORE`);
    return tx.hash;
  } catch (error) {
    console.error('[ToreToken] Failed to burn tokens:', error);
    throw error;
  }
}

/**
 * 토큰 정보 조회
 * 
 * @returns Promise<object> - 토큰 정보 객체
 */
export async function getTokenInfo() {
  try {
    const contract = await getToreTokenContract();
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    
    return {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: ethers.formatUnits(totalSupply, decimals)
    };
  } catch (error) {
    console.error('[ToreToken] Failed to get token info:', error);
    throw error;
  }
}

/**
 * 네트워크 연결 상태 확인
 * 
 * @returns Promise<boolean> - 연결 상태
 */
export async function checkToreTokenConnection(): Promise<boolean> {
  try {
    await getToreTokenContract();
    console.log('[ToreToken] Network connection: OK');
    return true;
  } catch (error) {
    console.error('[ToreToken] Network connection failed:', error);
    return false;
  }
}

/**
 * 지갑별 토큰 전송 내역 조회 (이벤트 기반)
 * 
 * @param walletAddress - 조회할 지갑 주소
 * @param fromBlock - 조회 시작 블록 (기본값: 0)
 * @param toBlock - 조회 종료 블록 (기본값: 'latest')
 * @returns Promise<Array> - 전송 내역 배열
 */
export async function getWalletTransferHistory(
  walletAddress: string, 
  fromBlock: number = 0, 
  toBlock: string | number = 'latest'
): Promise<Array<any>> {
  try {
    const contract = await getToreTokenContract();
    
    // Transfer 이벤트 필터 생성
    const filter = contract.filters.Transfer(null, walletAddress, null); // 받은 전송
    const filter2 = contract.filters.Transfer(walletAddress, null, null); // 보낸 전송
    
    // 이벤트 조회
    const receivedTransfers = await contract.queryFilter(filter, fromBlock, toBlock);
    const sentTransfers = await contract.queryFilter(filter2, fromBlock, toBlock);
    
    // 모든 전송 내역을 하나의 배열로 합치고 시간순 정렬
    const allTransfers = [...receivedTransfers, ...sentTransfers]
      .map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        from: event.args?.from,
        to: event.args?.to,
        amount: ethers.formatUnits(event.args?.value || 0, 18),
        timestamp: null // 블록 타임스탬프는 별도 조회 필요
      }))
      .sort((a, b) => b.blockNumber - a.blockNumber);
    
    console.log(`[ToreToken] Found ${allTransfers.length} transfer events for ${walletAddress}`);
    return allTransfers;
  } catch (error) {
    console.error('[ToreToken] Failed to get transfer history:', error);
    throw error;
  }
}
