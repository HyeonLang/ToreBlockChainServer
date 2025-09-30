/**
 * MultiToken 라우트
 * 
 * 다중 토큰 팩토리를 통한 여러 종류의 토큰 관리 API 라우트
 * - 토큰 생성, 발급(민트), 소각(burn) 기능만 제공
 * - 전송 기능은 프론트엔드에서 처리
 */

import express from 'express';
import {
  createNewToken,
  getAllTokensList,
  getActiveTokensList,
  getTokenInfoBySymbol,
  getTokenBalanceBySymbol,
  mintTokenBySymbol,
  burnTokenBySymbol,
  checkFactoryConnectionStatus
} from '../controllers/multiTokenController';
const router = express.Router();

// 인증 없이 모든 라우트 접근 가능

/**
 * @route   POST /api/multi-token/create
 * @desc    새 토큰 생성
 * @access  Private
 */
router.post('/create', createNewToken);

/**
 * @route   GET /api/multi-token/list
 * @desc    모든 토큰 목록 조회
 * @access  Private
 */
router.get('/list', getAllTokensList);

/**
 * @route   GET /api/multi-token/active
 * @desc    활성 토큰 목록 조회
 * @access  Private
 */
router.get('/active', getActiveTokensList);

/**
 * @route   GET /api/multi-token/info/:symbol
 * @desc    특정 토큰 정보 조회
 * @access  Private
 */
router.get('/info/:symbol', getTokenInfoBySymbol);

/**
 * @route   GET /api/multi-token/balance/:symbol/:address
 * @desc    특정 토큰 잔액 조회
 * @access  Private
 */
router.get('/balance/:symbol/:address', getTokenBalanceBySymbol);

/**
 * @route   POST /api/multi-token/mint
 * @desc    특정 토큰 민팅 (발급)
 * @access  Private
 */
router.post('/mint', mintTokenBySymbol);

/**
 * @route   POST /api/multi-token/burn
 * @desc    특정 토큰 소각
 * @access  Private
 */
router.post('/burn', burnTokenBySymbol);

/**
 * @route   GET /api/multi-token/connection
 * @desc    팩토리 연결 상태 확인
 * @access  Private
 */
router.get('/connection', checkFactoryConnectionStatus);

export default router;
