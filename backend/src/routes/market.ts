/**
 * 마켓 라우터
 * 
 * 기능:
 * - NFT 마켓 시스템 관련 API 라우트 정의
 * - NFT 판매 등록, 등록 취소, 구매
 * - 마켓 상품 목록 조회
 * - 판매자/구매자 거래 내역 조회
 * - 마켓 통계 조회
 * 
 * 라우트:
 * - POST /api/market/list-nft - NFT 판매 등록
 * - POST /api/market/cancel-listing - 판매 등록 취소
 * - POST /api/market/buy-nft - NFT 구매
 * - GET /api/market/listings - 판매 중인 NFT 목록
 * - GET /api/market/listing/:listingId - 특정 판매 등록 정보
 * - GET /api/market/user-listings/:address - 사용자 판매 등록 목록
 * - GET /api/market/user-purchases/:address - 사용자 구매 내역
 * - GET /api/market/stats - 마켓 통계
 */

import express from 'express';
import {
  listNFT,
  cancelListing,
  buyNFT,
  getListings,
  getListing,
  getUserListings,
  getUserPurchases,
  getMarketStats
} from '../controllers/marketController';

const router = express.Router();

/**
 * NFT 판매 등록
 * POST /api/market/list-nft
 * Body: { tokenId: number, price: string, sellerAddress: string }
 */
router.post('/list-nft', listNFT);

/**
 * 판매 등록 취소
 * POST /api/market/cancel-listing
 * Body: { listingId: number, sellerAddress: string }
 */
router.post('/cancel-listing', cancelListing);

/**
 * NFT 구매
 * POST /api/market/buy-nft
 * Body: { listingId: number, buyerAddress: string }
 */
router.post('/buy-nft', buyNFT);

/**
 * 판매 중인 NFT 목록 조회
 * GET /api/market/listings
 * Query: ?offset=number&limit=number&sortBy=string&order=string
 */
router.get('/listings', getListings);

/**
 * 특정 판매 등록 정보 조회
 * GET /api/market/listing/:listingId
 */
router.get('/listing/:listingId', getListing);

/**
 * 사용자 판매 등록 목록 조회
 * GET /api/market/user-listings/:address
 * Query: ?status=string (all, active, sold, cancelled)
 */
router.get('/user-listings/:address', getUserListings);

/**
 * 사용자 구매 내역 조회
 * GET /api/market/user-purchases/:address
 * Query: ?offset=number&limit=number
 */
router.get('/user-purchases/:address', getUserPurchases);

/**
 * 마켓 통계 조회
 * GET /api/market/stats
 */
router.get('/stats', getMarketStats);

export default router;
