/**
 * MultiToken 팩토리 연동 유틸리티
 * 
 * 기능:
 * - MultiTokenFactory 컨트랙트 연결 및 상호작용
 * - 여러 종류의 토큰 생성, 조회, 관리
 * - 각 토큰별 독립적인 잔액 및 전송 관리
 * - 토큰 목록 조회 및 정보 관리
 * 
 * 의존성:
 * - ethers.js: 이더리움 블록체인 상호작용 라이브러리
 * - MultiTokenFactory.sol: 다중 토큰 팩토리 스마트 컨트랙트 ABI
 * - CustomToken.sol: 개별 토큰 스마트 컨트랙트 ABI
 */

import { ethers } from "ethers";
import dotenv from "dotenv";

// 환경 변수 로드
dotenv.config();

/**
 * MultiTokenFactory 컨트랙트 ABI (주요 함수들)
 */
const FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply, address tokenOwner) external returns (address)",
  "function getTokenBySymbol(string memory symbol) external view returns (tuple(string name, string symbol, address contractAddress, uint256 totalSupply, uint8 decimals, address owner, uint256 createdAt, bool isActive))",
  "function getAllTokens() external view returns (tuple(string name, string symbol, address contractAddress, uint256 totalSupply, uint8 decimals, address owner, uint256 createdAt, bool isActive)[])",
  "function getActiveTokens() external view returns (tuple(string name, string symbol, address contractAddress, uint256 totalSupply, uint8 decimals, address owner, uint256 createdAt, bool isActive)[])",
  "function getTokenCount() external view returns (uint256)",
  "function isTokenExists(string memory symbol) external view returns (bool)",
  "function deactivateToken(string memory symbol) external",
  "function reactivateToken(string memory symbol) external"
];

/**
 * CustomToken 컨트랙트 ABI (개별 토큰)
 */
const TOKEN_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function owner() external view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

/**
 * 토큰 정보 인터페이스
 */
interface TokenInfo {
  name: string;
  symbol: string;
  contractAddress: string;
  totalSupply: string;
  decimals: number;
  owner: string;
  createdAt: number;
  isActive: boolean;
}

/**
 * MultiTokenFactory 컨트랙트 인스턴스 생성
 * 
 * @returns Promise<ethers.Contract> - MultiTokenFactory 컨트랙트 인스턴스
 */
export async function getMultiTokenFactory() {
  const address = process.env.MULTI_TOKEN_FACTORY_ADDRESS;
  if (!address) {
    throw new Error("MULTI_TOKEN_FACTORY_ADDRESS is required. Please set MULTI_TOKEN_FACTORY_ADDRESS environment variable.");
  }
  
  console.log(`[MultiToken] Factory address: ${address}`);
  
  // Provider 생성
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // 컨트랙트 인스턴스 생성
  const contract = new ethers.Contract(address, FACTORY_ABI, provider);
  
  try {
    // 컨트랙트 연결 확인
    const tokenCount = await contract.getTokenCount();
    console.log(`[MultiToken] Connected to factory. Current tokens: ${tokenCount}`);
  } catch (error) {
    console.error('[MultiToken] Failed to connect to factory:', error);
    throw new Error(`Failed to connect to MultiTokenFactory at ${address}: ${error}`);
  }
  
  return contract;
}

/**
 * MultiTokenFactory 컨트랙트 인스턴스 생성 (서명 가능)
 * 
 * @returns Promise<ethers.Contract> - 서명 가능한 MultiTokenFactory 컨트랙트 인스턴스
 */
export async function getMultiTokenFactoryWithWallet() {
  const address = process.env.MULTI_TOKEN_FACTORY_ADDRESS;
  if (!address) {
    throw new Error("MULTI_TOKEN_FACTORY_ADDRESS is required. Please set MULTI_TOKEN_FACTORY_ADDRESS environment variable.");
  }
  
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY is required. Please set PRIVATE_KEY environment variable.");
  }
  
  console.log(`[MultiToken] Factory address: ${address}`);
  
  // Provider 생성
  const rpcUrl = process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // 지갑 인스턴스 생성
  const wallet = new ethers.Wallet(pk, provider);
  
  // 컨트랙트 인스턴스 생성
  const contract = new ethers.Contract(address, FACTORY_ABI, wallet);
  
  try {
    // 컨트랙트 연결 확인
    const tokenCount = await contract.getTokenCount();
    console.log(`[MultiToken] Connected to factory. Current tokens: ${tokenCount}`);
  } catch (error) {
    console.error('[MultiToken] Failed to connect to factory:', error);
    throw new Error(`Failed to connect to MultiTokenFactory at ${address}: ${error}`);
  }
  
  return contract;
}

/**
 * 개별 토큰 컨트랙트 인스턴스 생성
 * 
 * @param tokenAddress 토큰 컨트랙트 주소
 * @returns Promise<ethers.Contract> - 토큰 컨트랙트 인스턴스
 */
export async function getTokenContract(tokenAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
  const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`[MultiToken] Connected to token: ${name} (${symbol})`);
  } catch (error) {
    console.error('[MultiToken] Failed to connect to token:', error);
    throw new Error(`Failed to connect to token contract at ${tokenAddress}: ${error}`);
  }
  
  return contract;
}

/**
 * 개별 토큰 컨트랙트 인스턴스 생성 (서명 가능)
 * 
 * @param tokenAddress 토큰 컨트랙트 주소
 * @returns Promise<ethers.Contract> - 서명 가능한 토큰 컨트랙트 인스턴스
 */
export async function getTokenContractWithWallet(tokenAddress: string) {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("PRIVATE_KEY is required. Please set PRIVATE_KEY environment variable.");
  }
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
  const wallet = new ethers.Wallet(pk, provider);
  const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
  
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`[MultiToken] Connected to token: ${name} (${symbol})`);
  } catch (error) {
    console.error('[MultiToken] Failed to connect to token:', error);
    throw new Error(`Failed to connect to token contract at ${tokenAddress}: ${error}`);
  }
  
  return contract;
}

/**
 * 새 토큰 생성
 * 
 * @param name 토큰 이름
 * @param symbol 토큰 심볼
 * @param decimals 소수점 자릿수
 * @param initialSupply 초기 공급량
 * @param owner 토큰 소유자
 * @returns Promise<string> - 토큰 컨트랙트 주소
 */
export async function createToken(
  name: string,
  symbol: string,
  decimals: number = 18,
  initialSupply: string,
  owner?: string
): Promise<string> {
  try {
    const factory = await getMultiTokenFactoryWithWallet();
    const decimalsNum = parseInt(decimals.toString());
    const initialSupplyWei = ethers.parseUnits(initialSupply, decimalsNum);
    
    const tx = await factory.createToken(name, symbol, decimalsNum, initialSupplyWei, owner || ethers.ZeroAddress);
    await tx.wait();
    
    console.log(`[MultiToken] Token created: ${name} (${symbol})`);
    return tx.hash; // 트랜잭션 해시 반환 (실제로는 이벤트에서 주소를 가져와야 함)
  } catch (error) {
    console.error('[MultiToken] Failed to create token:', error);
    throw error;
  }
}

/**
 * 모든 토큰 목록 조회
 * 
 * @returns Promise<TokenInfo[]> - 토큰 정보 배열
 */
export async function getAllTokens(): Promise<TokenInfo[]> {
  try {
    const factory = await getMultiTokenFactory();
    const tokens = await factory.getAllTokens();
    
    return tokens.map((token: any) => ({
      name: token.name,
      symbol: token.symbol,
      contractAddress: token.contractAddress,
      totalSupply: ethers.formatUnits(token.totalSupply, token.decimals),
      decimals: token.decimals,
      owner: token.owner,
      createdAt: token.createdAt,
      isActive: token.isActive
    }));
  } catch (error) {
    console.error('[MultiToken] Failed to get all tokens:', error);
    throw error;
  }
}

/**
 * 활성 토큰 목록 조회
 * 
 * @returns Promise<TokenInfo[]> - 활성 토큰 정보 배열
 */
export async function getActiveTokens(): Promise<TokenInfo[]> {
  try {
    const factory = await getMultiTokenFactory();
    const tokens = await factory.getActiveTokens();
    
    return tokens.map((token: any) => ({
      name: token.name,
      symbol: token.symbol,
      contractAddress: token.contractAddress,
      totalSupply: ethers.formatUnits(token.totalSupply, token.decimals),
      decimals: token.decimals,
      owner: token.owner,
      createdAt: token.createdAt,
      isActive: token.isActive
    }));
  } catch (error) {
    console.error('[MultiToken] Failed to get active tokens:', error);
    throw error;
  }
}

/**
 * 특정 토큰 정보 조회
 * 
 * @param symbol 토큰 심볼
 * @returns Promise<TokenInfo> - 토큰 정보
 */
export async function getTokenInfo(symbol: string): Promise<TokenInfo> {
  try {
    const factory = await getMultiTokenFactory();
    const token = await factory.getTokenBySymbol(symbol);
    
    return {
      name: token.name,
      symbol: token.symbol,
      contractAddress: token.contractAddress,
      totalSupply: ethers.formatUnits(token.totalSupply, token.decimals),
      decimals: token.decimals,
      owner: token.owner,
      createdAt: token.createdAt,
      isActive: token.isActive
    };
  } catch (error) {
    console.error('[MultiToken] Failed to get token info:', error);
    throw error;
  }
}

/**
 * 특정 토큰 잔액 조회
 * 
 * @param symbol 토큰 심볼
 * @param address 조회할 주소
 * @returns Promise<string> - 포맷된 토큰 잔액
 */
export async function getTokenBalance(symbol: string, address: string): Promise<string> {
  try {
    const tokenInfo = await getTokenInfo(symbol);
    const tokenContract = await getTokenContract(tokenInfo.contractAddress);
    
    const balance = await tokenContract.balanceOf(address);
    return ethers.formatUnits(balance, tokenInfo.decimals);
  } catch (error) {
    console.error('[MultiToken] Failed to get token balance:', error);
    throw error;
  }
}

/**
 * 특정 토큰 민팅
 * 
 * @param symbol 토큰 심볼
 * @param to 받을 주소
 * @param amount 민팅할 토큰 양
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function mintToken(symbol: string, to: string, amount: string): Promise<string> {
  try {
    const tokenInfo = await getTokenInfo(symbol);
    const tokenContract = await getTokenContractWithWallet(tokenInfo.contractAddress);
    
    const amountWei = ethers.parseUnits(amount, tokenInfo.decimals);
    const tx = await tokenContract.mint(to, amountWei);
    await tx.wait();
    
    console.log(`[MultiToken] Token minted: ${amount} ${symbol} to ${to}`);
    return tx.hash;
  } catch (error) {
    console.error('[MultiToken] Failed to mint token:', error);
    throw error;
  }
}

/**
 * 특정 토큰 전송
 * 
 * @param symbol 토큰 심볼
 * @param to 받을 주소
 * @param amount 전송할 토큰 양
 * @returns Promise<string> - 트랜잭션 해시
 */
export async function transferToken(symbol: string, to: string, amount: string): Promise<string> {
  try {
    const tokenInfo = await getTokenInfo(symbol);
    const tokenContract = await getTokenContractWithWallet(tokenInfo.contractAddress);
    
    const amountWei = ethers.parseUnits(amount, tokenInfo.decimals);
    const tx = await tokenContract.transfer(to, amountWei);
    await tx.wait();
    
    console.log(`[MultiToken] Token transferred: ${amount} ${symbol} to ${to}`);
    return tx.hash;
  } catch (error) {
    console.error('[MultiToken] Failed to transfer token:', error);
    throw error;
  }
}

/**
 * 팩토리 연결 상태 확인
 * 
 * @returns Promise<boolean> - 연결 상태
 */
export async function checkFactoryConnection(): Promise<boolean> {
  try {
    await getMultiTokenFactory();
    console.log('[MultiToken] Factory connection: OK');
    return true;
  } catch (error) {
    console.error('[MultiToken] Factory connection failed:', error);
    return false;
  }
}
