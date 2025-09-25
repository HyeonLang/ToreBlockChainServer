/**
 * Token Router
 * 
 * 기능:
 * - 토큰 발행/전송 관련 API 라우트 정의
 * - 입력 검증 및 미들웨어 적용
 * - RESTful API 설계
 * 
 * 라우트:
 * - POST /api/tokens/mint - 토큰 발행
 * - POST /api/tokens/transfer - 토큰 전송
 * - POST /api/tokens/batch-mint - 배치 토큰 발행
 * - GET /api/tokens/balance/:address - 토큰 잔액 조회
 * - GET /api/tokens/info - 토큰 정보 조회
 * - GET /api/tokens/connection - 토큰 연결 상태 확인
 */

import express from 'express';
import {
  mintToken,
  transferToken,
  getBalance,
  getTokenInfo,
  checkConnection,
  batchMintTokens
} from '../controllers/tokenController';

const router = express.Router();

/**
 * 토큰 발행
 * POST /api/tokens/mint
 * Body: { to: string, amount: string, reason?: string }
 * 
 * 예시:
 * {
 *   "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "amount": "1000.0",
 *   "reason": "game_reward"
 * }
 */
router.post('/mint', mintToken);

/**
 * 토큰 전송
 * POST /api/tokens/transfer
 * Body: { to: string, amount: string, from?: string, reason?: string }
 * 
 * 예시:
 * {
 *   "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "amount": "100.0",
 *   "from": "0x...",
 *   "reason": "payment"
 * }
 */
router.post('/transfer', transferToken);

/**
 * 배치 토큰 발행
 * POST /api/tokens/batch-mint
 * Body: { recipients: string[], amounts: string[], reason?: string }
 * 
 * 예시:
 * {
 *   "recipients": [
 *     "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *     "0x8ba1f109551bD432803012645Hac136c4c8C3C5"
 *   ],
 *   "amounts": ["1000.0", "500.0"],
 *   "reason": "batch_reward"
 * }
 */
router.post('/batch-mint', batchMintTokens);

/**
 * 토큰 잔액 조회
 * GET /api/tokens/balance/:address
 * 
 * 예시:
 * GET /api/tokens/balance/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
 */
router.get('/balance/:address', getBalance);

/**
 * 토큰 정보 조회
 * GET /api/tokens/info
 * 
 * 반환 정보:
 * - 토큰 이름, 심볼
 * - 총 공급량
 * - 소수점 자릿수
 * - 컨트랙트 주소
 */
router.get('/info', getTokenInfo);

/**
 * 토큰 연결 상태 확인
 * GET /api/tokens/connection
 * 
 * 반환 정보:
 * - 블록체인 연결 상태
 * - 컨트랙트 연결 상태
 */
router.get('/connection', checkConnection);

export default router;
