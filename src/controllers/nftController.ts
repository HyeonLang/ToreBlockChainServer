/**
 * NFT 관련 컨트롤러
 * 
 * 기능:
 * - 블록체인과의 상호작용 처리
 * - NFT 민팅, 소각, 컨트랙트 주소 조회
 * - 에러 처리 및 응답 포맷팅
 */

import { Request, Response } from "express";
import { getContract } from "../utils/contract";

/**
 * 컨트랙트 주소 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. 환경변수에서 CONTRACT_ADDRESS 읽기
 * 2. 주소 정보를 JSON 형태로 응답
 * 
 * @param _req - Express Request 객체 (사용하지 않음)
 * @param res - Express Response 객체
 * @returns { address: string | null } - 컨트랙트 주소 또는 null
 */
export async function contractAddressController(_req: Request, res: Response) {
  const address = process.env.CONTRACT_ADDRESS || null;
  return res.json({ address });
}

/**
 * NFT 민팅 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 to(받는 주소)와 tokenURI(메타데이터 URI) 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. mint 함수 호출하여 NFT 생성
 * 5. 트랜잭션 해시 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { txHash: string } - 트랜잭션 해시
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function mintNftController(req: Request, res: Response) {
  try {
    // 요청 본문에서 파라미터 추출
    const { to, tokenURI } = req.body as { to: string; tokenURI: string };
    
    // 필수 파라미터 및 형식 검증
    if (!to || typeof to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({ error: "Invalid 'to' address" });
    }
    if (!tokenURI || typeof tokenURI !== "string" || tokenURI.length > 2048) {
      return res.status(400).json({ error: "Invalid 'tokenURI'" });
    }
    try {
      const u = new URL(tokenURI);
      if (!["http:", "https:", "ipfs:"].includes(u.protocol)) {
        return res.status(400).json({ error: "Unsupported tokenURI scheme" });
      }
    } catch {
      return res.status(400).json({ error: "Malformed tokenURI" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // NFT 민팅 트랜잭션 실행
    const tx = await contract.mint(to, tokenURI);
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    
    // 트랜잭션 해시 반환 (영수증이 있으면 영수증 해시, 없으면 트랜잭션 해시)
    return res.json({ txHash: receipt?.hash ?? tx.hash });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    return res.status(500).json({ error: err.message || "Mint failed" });
  }
}

/**
 * NFT 소각 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 tokenId 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. burn 함수 호출하여 NFT 소각
 * 5. 트랜잭션 해시 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { txHash: string } - 트랜잭션 해시
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function burnNftController(req: Request, res: Response) {
  try {
    // 요청 본문에서 파라미터 추출
    const { tokenId } = req.body as { tokenId: string | number };
    
    // 필수 파라미터 및 형식 검증
    if (tokenId === undefined || tokenId === null) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    const numeric = typeof tokenId === "string" ? Number(tokenId) : tokenId;
    if (!Number.isInteger(numeric) || numeric < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // NFT 소각 트랜잭션 실행 (tokenId를 BigInt로 변환)
    const tx = await contract.burn(BigInt(tokenId));
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    
    // 트랜잭션 해시 반환
    return res.json({ txHash: receipt?.hash ?? tx.hash });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    return res.status(500).json({ error: err.message || "Burn failed" });
  }
}


