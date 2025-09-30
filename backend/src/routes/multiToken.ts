/**
 * MultiToken 라우트 - ERC-20 토큰 관리 API 엔드포인트 정의
 * 
 * 기능:
 * - MultiTokenFactory를 통한 다중 ERC-20 토큰 관리 API 라우트
 * - 토큰 생성, 발급(민팅), 소각, 조회 기능 제공
 * - RESTful API 설계 원칙에 따른 HTTP 메서드 분리
 * - 인증 없이 접근 가능한 내부 API (보안은 네트워크 레벨에서 관리)
 * 
 * API 엔드포인트 상세:
 * - POST /create - 새 ERC-20 토큰 생성 및 블록체인 배포
 * - GET /list - 생성된 모든 토큰 목록 조회
 * - GET /active - 활성 상태인 토큰만 조회
 * - GET /info/:symbol - 특정 토큰의 메타데이터 조회
 * - GET /balance/:symbol/:address - 특정 지갑의 토큰 잔액 조회
 * - POST /mint - 특정 토큰의 추가 발급 (토큰 경제 확장)
 * - POST /burn - 특정 토큰의 소각 (토큰 경제 축소)
 * - GET /connection - 팩토리 컨트랙트 연결 상태 확인
 * 
 * 특징:
 * - 각 라우트는 독립적인 컨트롤러 함수와 연결
 * - 에러 핸들링은 전역 미들웨어에서 처리
 * - 토큰 전송 기능은 프론트엔드에서 직접 블록체인과 상호작용
 * - 모든 응답은 JSON 형태로 통일된 형식 제공
 * 
 * 사용 목적:
 * - 게임 내 다양한 화폐 시스템 구축
 * - 보상 토큰, 스테이킹 토큰 등 다양한 경제 모델 지원
 * - 토큰별 독립적인 관리 및 모니터링
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
