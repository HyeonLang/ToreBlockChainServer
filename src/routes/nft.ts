/**
 * NFT 관련 라우터
 * 
 * 기능:
 * - NFT 컨트랙트 주소 조회
 * - NFT 민팅 (새로운 토큰 생성)
 * - NFT 소각 (토큰 삭제)
 * 
 * 실행 흐름:
 * 1. 클라이언트 요청 수신
 * 2. 해당하는 컨트롤러 함수 호출
 * 3. 컨트롤러에서 블록체인 상호작용 처리
 * 4. 결과를 JSON 형태로 응답
 */

import { Router } from "express";
import { burnNftController, contractAddressController, mintNftController } from "../controllers/nftController";

// Express 라우터 인스턴스 생성
const router = Router();

/**
 * GET /api/nft/address
 * NFT 컨트랙트 주소를 조회하는 엔드포인트
 * 
 * 요청: 없음
 * 응답: { address: string | null }
 */
router.get("/address", contractAddressController);

/**
 * POST /api/nft/mint
 * 새로운 NFT를 민팅하는 엔드포인트
 * 
 * 요청 본문: { to: string, tokenURI: string }
 * - to: NFT를 받을 주소
 * - tokenURI: NFT 메타데이터 URI
 * 
 * 응답: { txHash: string }
 */
router.post("/mint", mintNftController);

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

export default router;


