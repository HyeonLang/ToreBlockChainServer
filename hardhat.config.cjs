/**
 * Hardhat 설정 파일
 * 
 * 기능:
 * - Solidity 컴파일러 설정
 * - 네트워크 설정 (Hardhat, Fuji, Avalanche)
 * - 경로 설정 (컨트랙트, 테스트, 캐시, 아티팩트)
 * - TypeChain 설정 (TypeScript 타입 생성)
 * 
 * 네트워크:
 * - hardhat: 로컬 개발 네트워크
 * - fuji: Avalanche Fuji 테스트넷
 * - avalanche: Avalanche 메인넷
 * 
 * 환경변수:
 * - PRIVATE_KEY: 배포자 개인키
 * - FUJI_RPC_URL: Fuji 테스트넷 RPC URL
 * - AVALANCHE_RPC_URL: Avalanche 메인넷 RPC URL
 */

require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('ts-node/register');

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const FUJI_RPC_URL = process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.26",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: {},
    fuji: { url: FUJI_RPC_URL, accounts },
    avalanche: { url: AVALANCHE_RPC_URL, accounts }
  },
  paths: {
    sources: "blockchain/contracts",
    tests: "backend/tests",
    cache: "blockchain/cache",
    artifacts: "blockchain/artifacts"
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6"
  }
};

module.exports = config;


