/**
 * v1 API 라우터
 * 
 * 기능:
 * - RESTful API v1 버전의 NFT 관리 엔드포인트
 * - 표준 HTTP 메서드와 RESTful 경로 사용
 * - JWT 또는 API 키 인증 적용
 * - 레이트 리미팅 적용
 * 
 * API 설계 원칙:
 * - RESTful 설계 원칙 준수
 * - 리소스 기반 URL 구조
 * - HTTP 메서드의 의미적 사용
 * - 일관된 응답 형식
 * 
 * 인증 및 보안:
 * - JWT 또는 API 키 인증 필요
 * - 토큰 버킷 알고리즘 기반 레이트 리미팅
 * - 입력값 검증 및 에러 처리
 * 
 * 엔드포인트 목록:
 * - POST /v1/nfts - NFT 생성
 * - PATCH /v1/nfts/:nftId/transfer - NFT 전송
 * - DELETE /v1/nfts/:nftId - NFT 소각
 * - GET /v1/nfts/:nftId - NFT 조회
 * - GET /v1/wallets/:walletAddress/nfts - 지갑 NFT 목록
 */

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { 
  v1MintController,           // NFT 생성 컨트롤러
  v1TransferController,       // NFT 전송 컨트롤러
  v1BurnController,           // NFT 소각 컨트롤러
  v1GetOneController,         // NFT 조회 컨트롤러
  v1ListByWalletController    // 지갑 NFT 목록 조회 컨트롤러
} from "../controllers/v1Controllers";

// Express 라우터 인스턴스 생성
const v1 = Router();

/**
 * 전역 미들웨어 적용
 * 
 * 모든 v1 API 엔드포인트에 공통으로 적용되는 미들웨어:
 * 1. apiKeyAuth: API 키 인증 (JWT 인증은 상위 레벨에서 처리)
 * 2. rateLimit: 레이트 리미팅 (토큰 버킷 알고리즘)
 * 
 * 실행 순서:
 * 1. API 키 인증 확인
 * 2. 레이트 리미팅 확인
 * 3. 각 엔드포인트 컨트롤러 실행
 */
v1.use(apiKeyAuth, rateLimit);

/**
 * POST /v1/nfts
 * NFT 생성 엔드포인트
 * 
 * 요청 본문:
 * ```json
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "contractAddress": "0x1234567890123456789012345678901234567890",
 *   "itemInfo": {
 *     "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
 *   }
 * }
 * ```
 * 
 * 응답:
 * ```json
 * {
 *   "nftId": "1",
 *   "success": true
 * }
 * ```
 * 
 * 기능:
 * - 새로운 NFT 생성 (민팅)
 * - 지정된 지갑 주소로 NFT 전송
 * - 메타데이터 URI 연결
 * - 생성된 NFT ID 반환
 */
v1.post("/nfts", v1MintController);

/**
 * PATCH /v1/nfts/:nftId/transfer
 * NFT 전송 엔드포인트
 * 
 * URL 파라미터:
 * - nftId: 전송할 NFT의 ID
 * 
 * 요청 본문:
 * ```json
 * {
 *   "fromWalletAddress": "0x1111111111111111111111111111111111111111",
 *   "toWalletAddress": "0x2222222222222222222222222222222222222222",
 *   "contractAddress": "0x1234567890123456789012345678901234567890"
 * }
 * ```
 * 
 * 응답:
 * ```json
 * {
 *   "nftId": "1",
 *   "success": true
 * }
 * ```
 * 
 * 기능:
 * - 기존 NFT의 소유권 이전
 * - 보내는 주소에서 받는 주소로 전송
 * - 전송 권한 확인 필요
 */
v1.patch("/nfts/:nftId/transfer", v1TransferController);

/**
 * DELETE /v1/nfts/:nftId
 * NFT 소각 엔드포인트
 * 
 * URL 파라미터:
 * - nftId: 소각할 NFT의 ID
 * 
 * 요청 본문:
 * ```json
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "contractAddress": "0x1234567890123456789012345678901234567890"
 * }
 * ```
 * 
 * 응답:
 * ```json
 * {
 *   "nftId": "1",
 *   "success": true
 * }
 * ```
 * 
 * 기능:
 * - NFT 영구 삭제 (소각)
 * - 복구 불가능한 작업
 * - 컨트랙트 소유자만 실행 가능
 */
v1.delete("/nfts/:nftId", v1BurnController);

/**
 * GET /v1/nfts/:nftId
 * NFT 조회 엔드포인트
 * 
 * URL 파라미터:
 * - nftId: 조회할 NFT의 ID
 * 
 * 응답 (존재하는 경우):
 * ```json
 * {
 *   "exists": true,
 *   "ownerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "contractAddress": "0x1234567890123456789012345678901234567890",
 *   "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
 * }
 * ```
 * 
 * 응답 (존재하지 않는 경우):
 * ```json
 * {
 *   "exists": false
 * }
 * ```
 * 
 * 기능:
 * - 특정 NFT의 상세 정보 조회
 * - 소유자 주소, 컨트랙트 주소, 메타데이터 URI 반환
 * - NFT 존재 여부 확인
 */
v1.get("/nfts/:nftId", v1GetOneController);

/**
 * GET /v1/wallets/:walletAddress/nfts
 * 지갑 NFT 목록 조회 엔드포인트
 * 
 * URL 파라미터:
 * - walletAddress: 조회할 지갑 주소
 * 
 * 응답:
 * ```json
 * {
 *   "nfts": [
 *     {
 *       "nftId": "1",
 *       "contractAddress": "0x1234567890123456789012345678901234567890",
 *       "itemInfo": {
 *         "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
 *       }
 *     }
 *   ],
 *   "success": true
 * }
 * ```
 * 
 * 기능:
 * - 특정 지갑이 소유한 모든 NFT 목록 조회
 * - 각 NFT의 ID, 컨트랙트 주소, 메타데이터 URI 포함
 * - 빈 배열 반환 가능 (소유한 NFT가 없는 경우)
 */
v1.get("/wallets/:walletAddress/nfts", v1ListByWalletController);

// 라우터 export
export default v1;



