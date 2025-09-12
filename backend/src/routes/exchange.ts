/**
 * ToreExchange 라우터
 * 
 * 기능:
 * - NFT와 TORE 토큰 간 거래소 관련 API 라우트 정의
 * - 거래 생성, 구매, 취소
 * - 거래 정보 조회 및 목록 조회
 * - 사용자 거래 내역 조회
 * - 활성 거래 목록 조회
 * - 거래소 통계 조회
 * 
 * 라우트:
 * - POST /api/exchange/create-trade - 거래 생성
 * - POST /api/exchange/buy-nft - NFT 구매
 * - POST /api/exchange/cancel-trade - 거래 취소
 * - GET /api/exchange/trade/:tradeId - 거래 정보 조회
 * - GET /api/exchange/user-trades/:address - 사용자 거래 목록
 * - GET /api/exchange/active-trades - 활성 거래 목록
 * - GET /api/exchange/stats - 거래소 통계
 */

import express from 'express';
import {
  createTrade,
  buyNFT,
  cancelTrade,
  getTrade,
  getUserTrades,
  getActiveTrades,
  getExchangeStats
} from '../controllers/exchangeController';

const router = express.Router();

/**
 * 거래 생성
 * POST /api/exchange/create-trade
 * Body: { tokenId: number, price: string }
 */
router.post('/create-trade', createTrade);

/**
 * NFT 구매
 * POST /api/exchange/buy-nft
 * Body: { tradeId: number }
 */
router.post('/buy-nft', buyNFT);

/**
 * 거래 취소
 * POST /api/exchange/cancel-trade
 * Body: { tradeId: number }
 */
router.post('/cancel-trade', cancelTrade);

/**
 * 거래 정보 조회
 * GET /api/exchange/trade/:tradeId
 */
router.get('/trade/:tradeId', getTrade);

/**
 * 사용자 거래 목록 조회
 * GET /api/exchange/user-trades/:address
 */
router.get('/user-trades/:address', getUserTrades);

/**
 * 활성 거래 목록 조회
 * GET /api/exchange/active-trades
 * Query: ?offset=number&limit=number
 */
router.get('/active-trades', getActiveTrades);

/**
 * 거래소 통계 조회
 * GET /api/exchange/stats
 */
router.get('/stats', getExchangeStats);

export default router;
