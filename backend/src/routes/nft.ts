/**
 * NFT 관련 라우터
 * 
 * 기능:
 * - NFT 컨트랙트 주소 조회
 * - NFT 민팅 (새로운 토큰 생성)
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
  contractAddressController, 
  mintNftController, 
  getNftController,
  getWalletNftsController,
  getNftTransactionHistoryController,
  getWalletTransactionHistoryController,
  lockNftController,
  unlockNftController,
  getVaultedNftsController,
  testPinataController
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

/**
 * POST /api/nft/lockup
 * NFT를 Vault에 락업하는 엔드포인트
 * 
 * 요청 본문: { walletAddress: string, tokenId: number }
 * - walletAddress: NFT 소유자 주소
 * - tokenId: 락업할 NFT의 토큰 ID
 * 
 * 응답: { txHash: string, vaultAddress: string }
 * 
 * 주의: 락업하기 전에 NFT 컨트랙트에 Vault 주소를 approve 해야 합니다.
 */
router.post("/lockup", lockNftController);

/**
 * POST /api/nft/unlockup
 * NFT를 Vault에서 꺼내는 엔드포인트 (락업 해제)
 * 
 * 요청 본문: { walletAddress: string, tokenId: number }
 * - walletAddress: NFT 소유자 주소
 * - tokenId: 락업 해제할 NFT의 토큰 ID
 * 
 * 응답: { txHash: string, vaultAddress: string }
 */
router.post("/unlockup", unlockNftController);

/**
 * GET /api/nft/vault
 * 지갑이 Vault에 보관한 NFT 목록을 조회하는 엔드포인트
 * 
 * 쿼리 파라미터: walletAddress
 * - walletAddress: 조회할 지갑 주소
 * 
 * 응답: { walletAddress: string, nftContract: string, vaultAddress: string, vaultedNfts: Array<number> }
 */
router.get("/vault", getVaultedNftsController);

/**
 * GET /api/nft/test-pinata
 * Pinata IPFS 연결을 테스트하는 엔드포인트
 * 
 * 요청: 없음
 * 응답: { success: boolean, message: string }
 * 
 * 참고: PINATA_API_KEY와 PINATA_SECRET_API_KEY가 .env에 설정되어 있어야 합니다.
 */
router.get("/test-pinata", testPinataController);

export default router;


