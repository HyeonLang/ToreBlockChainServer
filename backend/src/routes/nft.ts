/**
 * NFT 관련 라우터
 * 
 * 기능:
 * - NFT 컨트랙트 주소 조회
 * - NFT 민팅 (새로운 토큰 생성)
 * - NFT 전송 (토큰 소유권 이전)
 * - NFT 소각 (토큰 삭제)
 * - NFT 조회 (소유자 및 메타데이터 URI)
 * 
 * 실행 흐름:
 * 1. 클라이언트 요청 수신
 * 2. 해당하는 컨트롤러 함수 호출
 * 3. 컨트롤러에서 블록체인 상호작용 처리
 * 4. 결과를 JSON 형태로 응답
 */

import { Router } from "express";
import { 
  burnNftController, 
  contractAddressController, 
  mintNftController, 
  transferNftController,
  getNftController,
  getWalletNftsController,
  getNftTransactionHistoryController,
  getWalletTransactionHistoryController
} from "../controllers/nftController";

// Express 라우터 인스턴스 생성
const router = Router();

/**
 * GET /api/nft/contract-address
 * NFT 컨트랙트 주소를 조회하는 엔드포인트
 * 
 * 요청: 없음
 * 응답: { address: string | null }
 */
router.get("/contract-address", contractAddressController);

/**
 * POST /api/nft/mint
 * 새로운 NFT를 민팅하는 엔드포인트
 * 
 * 요청 본문: { to: string, tokenURI: string, itemId?: number }
 * - to (또는 walletAddress): NFT를 받을 주소
 * - tokenURI: NFT 메타데이터 URI
 * - itemId (선택): 게임 아이템 ID (제공 시 mintWithItemId 사용)
 * 
 * 응답: { txHash: string, tokenId: number }
 * 
 * 참고: 컨트랙트 주소는 백엔드에서 관리하므로 요청에 포함하지 마세요.
 */
router.post("/mint", mintNftController);

/**
 * POST /api/nft/transfer
 * NFT를 전송하는 엔드포인트
 * 
 * 요청 본문: { from: string, to: string, tokenId: string | number }
 * - from: NFT를 보내는 주소
 * - to: NFT를 받을 주소
 * - tokenId: 전송할 NFT의 토큰 ID
 * 
 * 응답: { txHash: string }
 */
router.post("/transfer", transferNftController);

/**
 * POST /api/nft/burn
 * NFT를 소각하는 엔드포인트
 * 
 * 요청 본문: { tokenId: string | number }
 * - tokenId: 소각할 NFT의 토큰 ID
 * 
 * 응답: { txHash: string }
 */
router.post("/burn", burnNftController);

/**
 * GET /api/nft/wallet
 * 지갑의 모든 NFT를 조회하는 엔드포인트
 * 
 * 쿼리 파라미터: walletAddress
 * - walletAddress: 조회할 지갑 주소
 * 
 * 응답: { nfts: Array<{tokenId: number, owner: string, tokenURI: string}> }
 */
router.get("/wallet", getWalletNftsController);

/**
 * GET /api/nft/:tokenId
 * 특정 NFT 정보를 조회하는 엔드포인트
 * 
 * URL 파라미터: tokenId
 * - tokenId: 조회할 NFT의 토큰 ID
 * 
 * 응답: { owner: string, tokenURI: string }
 */
router.get("/:tokenId", getNftController);

/**
 * GET /api/nft/:tokenId/history
 * 특정 NFT의 거래 이력을 조회하는 엔드포인트
 * 
 * URL 파라미터: tokenId
 * - tokenId: 조회할 NFT의 토큰 ID
 * 
 * 응답: { tokenId: number, transactions: Array<{from: string, to: string, tokenId: number, txHash: string, blockNumber: number, timestamp: number, type: string}> }
 */
router.get("/:tokenId/history", getNftTransactionHistoryController);

/**
 * GET /api/nft/wallet/history
 * 지갑의 NFT 거래 이력을 조회하는 엔드포인트
 * 
 * 쿼리 파라미터: walletAddress
 * - walletAddress: 조회할 지갑 주소
 * 
 * 응답: { walletAddress: string, transactions: Array<{from: string, to: string, tokenId: number, txHash: string, blockNumber: number, timestamp: number, type: string, direction: string}> }
 */
router.get("/wallet/history", getWalletTransactionHistoryController);

export default router;


