/**
 * ToreToken 라우터 (레거시 - 단일 토큰 시스템)
 * 
 * 기능:
 * - ToreToken ERC-20 토큰 관련 API 라우트 정의
 * - 토큰 잔액 조회, 민팅, 소각
 * - 게임 보상 지급 및 배치 전송
 * - 게임 컨트랙트 및 매니저 관리
 * - 지갑별 전송 내역 조회
 * 
 * 주의: 새로운 토큰 생성은 MultiTokenFactory 사용 권장
 * 
 * 라우트:
 * - GET /api/tore/balance/:address - 토큰 잔액 조회
 * - POST /api/tore/mint - 토큰 민팅
 * - POST /api/tore/burn - 토큰 소각
 * - POST /api/tore/reward - 게임 보상 지급
 * - POST /api/tore/batch-transfer - 배치 전송
 * - POST /api/tore/add-game-contract - 게임 컨트랙트 추가
 * - POST /api/tore/add-game-manager - 게임 매니저 추가
 * - GET /api/tore/info - 토큰 정보 조회
 * - GET /api/tore/history/:address - 지갑 전송 내역 조회
 * - GET /api/tore/connection - 토큰 연결 상태 확인
 */

import express from 'express';
import {
  getBalance,
  mint,
  burn,
  distributeReward,
  batchTransferTokens,
  addGameContractToToken,
  addGameManagerToToken,
  getTokenInfo,
  getTransferHistory,
  checkConnection
} from '../controllers/toreTokenController';

const router = express.Router();

/**
 * 토큰 잔액 조회
 * GET /api/tore/balance/:address
 */
router.get('/balance/:address', getBalance);

/**
 * 토큰 민팅
 * POST /api/tore/mint
 * Body: { to: string, amount: string }
 */
router.post('/mint', mint);

/**
 * 토큰 소각
 * POST /api/tore/burn
 * Body: { amount: string }
 */
router.post('/burn', burn);

/**
 * 게임 보상 지급
 * POST /api/tore/reward
 * Body: { player: string, amount: string }
 */
router.post('/reward', distributeReward);

/**
 * 배치 전송
 * POST /api/tore/batch-transfer
 * Body: { recipients: string[], amounts: string[] }
 */
router.post('/batch-transfer', batchTransferTokens);

/**
 * 게임 컨트랙트 추가
 * POST /api/tore/add-game-contract
 * Body: { contractAddress: string }
 */
router.post('/add-game-contract', addGameContractToToken);

/**
 * 게임 매니저 추가
 * POST /api/tore/add-game-manager
 * Body: { managerAddress: string }
 */
router.post('/add-game-manager', addGameManagerToToken);


/**
 * 토큰 정보 조회
 * GET /api/tore/info
 */
router.get('/info', getTokenInfo);

/**
 * 지갑 전송 내역 조회
 * GET /api/tore/history/:address
 * Query: ?fromBlock=number&toBlock=number|latest
 */
router.get('/history/:address', getTransferHistory);

/**
 * 토큰 연결 상태 확인
 * GET /api/tore/connection
 */
router.get('/connection', checkConnection);

export default router;
