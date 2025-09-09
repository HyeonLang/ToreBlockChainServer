/**
 * v1 API 컨트롤러
 * 
 * 기능:
 * - RESTful API v1 버전의 NFT 관리 기능
 * - 표준 HTTP 메서드와 RESTful 경로 사용
 * - JWT 또는 API 키 인증 필요
 * - 입력값 검증 및 에러 처리
 * 
 * API 특징:
 * - RESTful 설계 원칙 준수
 * - 일관된 응답 형식
 * - 상세한 에러 메시지
 * - 컨트랙트 주소 검증
 * 
 * 엔드포인트:
 * - POST /v1/nfts - NFT 생성
 * - PATCH /v1/nfts/:nftId/transfer - NFT 전송
 * - DELETE /v1/nfts/:nftId - NFT 소각
 * - GET /v1/nfts/:nftId - NFT 조회
 * - GET /v1/wallets/:walletAddress/nfts - 지갑 NFT 목록
 */

import { Request, Response } from "express";
import { getContract } from "../utils/contract";

/**
 * 이더리움 주소 형식 검증 함수
 * 
 * @param addr - 검증할 주소 문자열
 * @returns 주소 형식이 올바른지 여부
 * 
 * 검증 규칙:
 * - 0x로 시작
 * - 16진수 문자 (0-9, a-f, A-F)
 * - 총 42자리 (0x + 40자리)
 * 
 * 사용 예시:
 * ```typescript
 * if (isAddress("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6")) {
 *   console.log("Valid address");
 * }
 * ```
 */
function isAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * v1 NFT 생성 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 파라미터 추출 (walletAddress, contractAddress, itemInfo)
 * 2. 필수 파라미터 검증 (walletAddress, itemInfo.tokenURI)
 * 3. 주소 형식 검증 (이더리움 주소 형식)
 * 4. 컨트랙트 인스턴스 생성
 * 5. 컨트랙트 주소 검증 (선택사항)
 * 6. 블록체인에서 NFT 민팅 실행
 * 7. 트랜잭션 완료 대기
 * 8. Transfer 이벤트에서 tokenId 추출
 * 9. 생성된 NFT ID와 성공 상태 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns 생성된 NFT ID와 성공 상태
 * @throws 400 - 잘못된 요청 (필수 파라미터 누락, 형식 오류)
 * @throws 500 - 서버 내부 오류 (블록체인 상호작용 실패)
 * 
 * 요청 예시:
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
 * 응답 예시:
 * ```json
 * {
 *   "nftId": "1",
 *   "success": true
 * }
 * ```
 */
export async function v1MintController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[v1 Mint] Request body:', req.body);
    
    // 요청 본문에서 파라미터 추출
    const { walletAddress, contractAddress, itemInfo } = req.body as {
      walletAddress?: string;                    // NFT를 받을 지갑 주소
      contractAddress?: string;                  // 컨트랙트 주소 (선택사항, 검증용)
      itemInfo?: { 
        tokenURI?: string;                       // NFT 메타데이터 URI
      } & Record<string, unknown>;               // 기타 메타데이터 (확장 가능)
    };

    // 필수 파라미터 검증: walletAddress
    if (!walletAddress || !isAddress(walletAddress)) {
      console.log('[v1 Mint] Invalid walletAddress:', walletAddress);
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    // 필수 파라미터 검증: itemInfo.tokenURI
    const tokenURI = itemInfo?.tokenURI;
    if (!tokenURI || typeof tokenURI !== "string") {
      console.log('[v1 Mint] Invalid tokenURI:', tokenURI);
      return res.status(400).json({ error: "Invalid itemInfo.tokenURI" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 컨트랙트 주소 검증 (선택사항)
    // 요청에서 제공된 contractAddress와 실제 컨트랙트 주소가 일치하는지 확인
    if (contractAddress && contract.target?.toString().toLowerCase() !== contractAddress.toLowerCase()) {
      console.log('[v1 Mint] Contract address mismatch:', {
        provided: contractAddress,
        actual: contract.target?.toString()
      });
      return res.status(400).json({ error: "Mismatched contractAddress" });
    }

    // 블록체인에서 NFT 민팅 실행
    console.log('[v1 Mint] Minting NFT to:', walletAddress, 'with URI:', tokenURI);
    const tx = await contract.mint(walletAddress, tokenURI);
    
    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    console.log('[v1 Mint] Transaction mined:', receipt?.hash);

    // Transfer 이벤트에서 tokenId 추출
    // 민팅 시 발생하는 Transfer 이벤트에서 새로 생성된 NFT의 ID를 가져옴
    let tokenId: number | null = null;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "Transfer") {
            // Transfer 이벤트의 세 번째 인자가 tokenId
            tokenId = Number(parsed.args?.[2]);
            console.log('[v1 Mint] TokenId extracted from Transfer event:', tokenId);
            break;
          }
        } catch (parseError) {
          // 로그 파싱 실패 시 무시하고 계속 진행
          console.warn('[v1 Mint] Failed to parse log:', parseError);
        }
      }
    }

    // 성공 응답 반환
    console.log('[v1 Mint] Success:', { nftId: tokenId, success: true });
    return res.json({ 
      nftId: tokenId?.toString() ?? null,  // tokenId를 문자열로 변환
      success: true 
    });
    
  } catch (err: any) {
    // 에러 처리 및 로깅
    console.error('[v1 Mint] Error:', err);
    return res.status(500).json({ 
      error: err.message || "Mint failed" 
    });
  }
}

/**
 * v1 NFT 전송 컨트롤러
 * 
 * 실행 흐름:
 * 1. URL 파라미터에서 nftId 추출
 * 2. 요청 본문에서 주소 정보 추출 (fromWalletAddress, toWalletAddress)
 * 3. 필수 파라미터 검증 (nftId, fromWalletAddress, toWalletAddress)
 * 4. 주소 형식 검증 (이더리움 주소 형식)
 * 5. 컨트랙트 인스턴스 생성
 * 6. 컨트랙트 주소 검증 (선택사항)
 * 7. 블록체인에서 NFT 전송 실행
 * 8. 트랜잭션 완료 대기
 * 9. 성공 상태 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns 전송된 NFT ID와 성공 상태
 * @throws 400 - 잘못된 요청 (필수 파라미터 누락, 형식 오류)
 * @throws 500 - 서버 내부 오류 (블록체인 상호작용 실패)
 * 
 * 요청 예시:
 * ```json
 * {
 *   "fromWalletAddress": "0x1111111111111111111111111111111111111111",
 *   "toWalletAddress": "0x2222222222222222222222222222222222222222",
 *   "contractAddress": "0x1234567890123456789012345678901234567890"
 * }
 * ```
 * 
 * 응답 예시:
 * ```json
 * {
 *   "nftId": "1",
 *   "success": true
 * }
 * ```
 */
export async function v1TransferController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[v1 Transfer] Request params:', req.params, 'body:', req.body);
    
    // URL 파라미터에서 NFT ID 추출
    const { nftId } = req.params as { nftId: string };
    
    // 요청 본문에서 주소 정보 추출
    const { fromWalletAddress, toWalletAddress, contractAddress } = req.body as {
      fromWalletAddress?: string;    // NFT를 보내는 지갑 주소
      toWalletAddress?: string;      // NFT를 받을 지갑 주소
      contractAddress?: string;      // 컨트랙트 주소 (선택사항, 검증용)
    };

    // 필수 파라미터 검증: nftId
    if (!nftId || Number.isNaN(Number(nftId))) {
      console.log('[v1 Transfer] Invalid nftId:', nftId);
      return res.status(400).json({ error: "Invalid nftId" });
    }
    
    // 필수 파라미터 검증: fromWalletAddress
    if (!fromWalletAddress || !isAddress(fromWalletAddress)) {
      console.log('[v1 Transfer] Invalid fromWalletAddress:', fromWalletAddress);
      return res.status(400).json({ error: "Invalid fromWalletAddress" });
    }
    
    // 필수 파라미터 검증: toWalletAddress
    if (!toWalletAddress || !isAddress(toWalletAddress)) {
      console.log('[v1 Transfer] Invalid toWalletAddress:', toWalletAddress);
      return res.status(400).json({ error: "Invalid toWalletAddress" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 컨트랙트 주소 검증 (선택사항)
    if (contractAddress && contract.target?.toString().toLowerCase() !== contractAddress.toLowerCase()) {
      console.log('[v1 Transfer] Contract address mismatch:', {
        provided: contractAddress,
        actual: contract.target?.toString()
      });
      return res.status(400).json({ error: "Mismatched contractAddress" });
    }

    // 블록체인에서 NFT 전송 실행
    console.log('[v1 Transfer] Transferring NFT:', nftId, 'from:', fromWalletAddress, 'to:', toWalletAddress);
    const tx = await contract.transferFrom(fromWalletAddress, toWalletAddress, BigInt(nftId));
    
    // 트랜잭션 완료 대기
    await tx.wait();
    console.log('[v1 Transfer] Transaction mined:', tx.hash);

    // 성공 응답 반환
    console.log('[v1 Transfer] Success:', { nftId, success: true });
    return res.json({ nftId, success: true });
    
  } catch (err: any) {
    // 에러 처리 및 로깅
    console.error('[v1 Transfer] Error:', err);
    return res.status(500).json({ 
      error: err.message || "Transfer failed" 
    });
  }
}

/**
 * v1 NFT 소각 컨트롤러
 * 
 * 실행 흐름:
 * 1. URL 파라미터에서 nftId 추출
 * 2. 요청 본문에서 선택적 파라미터 추출 (walletAddress, contractAddress)
 * 3. 필수 파라미터 검증 (nftId)
 * 4. 선택적 주소 형식 검증 (walletAddress)
 * 5. 컨트랙트 인스턴스 생성
 * 6. 컨트랙트 주소 검증 (선택사항)
 * 7. 블록체인에서 NFT 소각 실행
 * 8. 트랜잭션 완료 대기
 * 9. 성공 상태 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns 소각된 NFT ID와 성공 상태
 * @throws 400 - 잘못된 요청 (필수 파라미터 누락, 형식 오류)
 * @throws 500 - 서버 내부 오류 (블록체인 상호작용 실패)
 * 
 * 요청 예시:
 * ```json
 * {
 *   "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "contractAddress": "0x1234567890123456789012345678901234567890"
 * }
 * ```
 * 
 * 응답 예시:
 * ```json
 * {
 *   "nftId": "1",
 *   "success": true
 * }
 * ```
 */
export async function v1BurnController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[v1 Burn] Request params:', req.params, 'body:', req.body);
    
    // URL 파라미터에서 NFT ID 추출
    const { nftId } = req.params as { nftId: string };
    
    // 요청 본문에서 선택적 파라미터 추출
    const { walletAddress, contractAddress } = req.body as {
      walletAddress?: string;      // 지갑 주소 (선택사항, 검증용)
      contractAddress?: string;    // 컨트랙트 주소 (선택사항, 검증용)
    };

    // 필수 파라미터 검증: nftId
    if (!nftId || Number.isNaN(Number(nftId))) {
      console.log('[v1 Burn] Invalid nftId:', nftId);
      return res.status(400).json({ error: "Invalid nftId" });
    }
    
    // 선택적 파라미터 검증: walletAddress
    if (walletAddress && !isAddress(walletAddress)) {
      console.log('[v1 Burn] Invalid walletAddress:', walletAddress);
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 컨트랙트 주소 검증 (선택사항)
    if (contractAddress && contract.target?.toString().toLowerCase() !== contractAddress.toLowerCase()) {
      console.log('[v1 Burn] Contract address mismatch:', {
        provided: contractAddress,
        actual: contract.target?.toString()
      });
      return res.status(400).json({ error: "Mismatched contractAddress" });
    }

    // 블록체인에서 NFT 소각 실행
    console.log('[v1 Burn] Burning NFT:', nftId);
    const tx = await contract.burn(BigInt(nftId));
    
    // 트랜잭션 완료 대기
    await tx.wait();
    console.log('[v1 Burn] Transaction mined:', tx.hash);

    // 성공 응답 반환
    console.log('[v1 Burn] Success:', { nftId, success: true });
    return res.json({ nftId, success: true });
    
  } catch (err: any) {
    // 에러 처리 및 로깅
    console.error('[v1 Burn] Error:', err);
    return res.status(500).json({ 
      error: err.message || "Burn failed" 
    });
  }
}

/**
 * v1 NFT 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. URL 파라미터에서 nftId 추출
 * 2. 필수 파라미터 검증 (nftId)
 * 3. 컨트랙트 인스턴스 생성
 * 4. 블록체인에서 NFT 정보 조회 시도
 * 5. NFT 존재 여부에 따른 응답 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns NFT 정보 또는 존재하지 않음 상태
 * @throws 400 - 잘못된 요청 (필수 파라미터 누락, 형식 오류)
 * @throws 500 - 서버 내부 오류 (블록체인 상호작용 실패)
 * 
 * 응답 예시 (존재하는 경우):
 * ```json
 * {
 *   "exists": true,
 *   "ownerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
 *   "contractAddress": "0x1234567890123456789012345678901234567890",
 *   "tokenURI": "https://ipfs.io/ipfs/QmYourMetadataHash"
 * }
 * ```
 * 
 * 응답 예시 (존재하지 않는 경우):
 * ```json
 * {
 *   "exists": false
 * }
 * ```
 */
export async function v1GetOneController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[v1 GetOne] Request params:', req.params);
    
    // URL 파라미터에서 NFT ID 추출
    const { nftId } = req.params as { nftId: string };
    
    // 필수 파라미터 검증: nftId
    if (!nftId || Number.isNaN(Number(nftId))) {
      console.log('[v1 GetOne] Invalid nftId:', nftId);
      return res.status(400).json({ error: "Invalid nftId" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    try {
      // 블록체인에서 NFT 정보 조회 (병렬 처리)
      console.log('[v1 GetOne] Querying NFT info for ID:', nftId);
      const [owner, tokenURI] = await Promise.all([
        contract.ownerOf(BigInt(nftId)),    // NFT 소유자 조회
        contract.tokenURI(BigInt(nftId))    // NFT 메타데이터 URI 조회
      ]);
      
      // NFT가 존재하는 경우 상세 정보 반환
      console.log('[v1 GetOne] NFT found:', { nftId, owner, tokenURI });
      return res.json({ 
        exists: true, 
        ownerAddress: owner, 
        contractAddress: contract.target?.toString() ?? null, 
        tokenURI 
      });
      
    } catch (inner) {
      // NFT가 존재하지 않는 경우 (ownerOf 또는 tokenURI 호출 실패)
      console.log('[v1 GetOne] NFT not found for ID:', nftId);
      return res.json({ exists: false });
    }
    
  } catch (err: any) {
    // 에러 처리 및 로깅
    console.error('[v1 GetOne] Error:', err);
    return res.status(500).json({ 
      error: err.message || "Query failed" 
    });
  }
}

/**
 * v1 지갑 NFT 목록 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. URL 파라미터에서 walletAddress 추출
 * 2. 필수 파라미터 검증 (walletAddress)
 * 3. 주소 형식 검증 (이더리움 주소 형식)
 * 4. 컨트랙트 인스턴스 생성
 * 5. 다음 토큰 ID 조회 (최대 ID 범위 확인)
 * 6. 1부터 최대 ID까지 순회하며 소유자 확인
 * 7. 해당 지갑이 소유한 NFT만 수집
 * 8. NFT 목록과 성공 상태 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns 지갑이 소유한 NFT 목록과 성공 상태
 * @throws 400 - 잘못된 요청 (필수 파라미터 누락, 형식 오류)
 * @throws 500 - 서버 내부 오류 (블록체인 상호작용 실패)
 * 
 * 응답 예시:
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
 */
export async function v1ListByWalletController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[v1 ListByWallet] Request params:', req.params);
    
    // URL 파라미터에서 지갑 주소 추출
    const { walletAddress } = req.params as { walletAddress: string };
    
    // 필수 파라미터 검증: walletAddress
    if (!walletAddress || !isAddress(walletAddress)) {
      console.log('[v1 ListByWallet] Invalid walletAddress:', walletAddress);
      return res.status(400).json({ error: "Invalid walletAddress" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 다음 토큰 ID 조회 (현재까지 생성된 최대 ID + 1)
    const nextIdBn: bigint = await contract.nextTokenId();
    const maxId = Number(nextIdBn);
    
    console.log('[v1 ListByWallet] Next token ID:', maxId, 'Searching for wallet:', walletAddress);

    // NFT 목록을 저장할 배열
    const nfts: Array<{ 
      nftId: string; 
      contractAddress: string | null; 
      itemInfo?: { tokenURI: string } 
    }> = [];
    
    // 1부터 최대 ID까지 순회하며 소유자 확인
    for (let id = 1; id <= maxId; id += 1) {
      try {
        // 해당 ID의 NFT 소유자 조회
        const owner: string = await contract.ownerOf(BigInt(id));
        
        // 소유자가 요청한 지갑 주소와 일치하는지 확인 (대소문자 무시)
        if (owner.toLowerCase() === walletAddress.toLowerCase()) {
          // 해당 NFT의 메타데이터 URI 조회
          const tokenURI: string = await contract.tokenURI(BigInt(id));
          
          // NFT 정보를 목록에 추가
          nfts.push({ 
            nftId: String(id), 
            contractAddress: contract.target?.toString() ?? null, 
            itemInfo: { tokenURI } 
          });
          
          console.log('[v1 ListByWallet] Found NFT:', { id, owner, tokenURI });
        }
      } catch (nftError) {
        // 개별 NFT 조회 실패 시 무시하고 계속 진행
        // (삭제된 NFT이거나 존재하지 않는 ID일 수 있음)
        console.warn('[v1 ListByWallet] Failed to query NFT ID:', id, nftError);
      }
    }
    
    console.log('[v1 ListByWallet] Found', nfts.length, 'NFTs for wallet:', walletAddress);
    
    // 성공 응답 반환
    return res.json({ nfts, success: true });
    
  } catch (err: any) {
    // 에러 처리 및 로깅
    console.error('[v1 ListByWallet] Error:', err);
    return res.status(500).json({ 
      error: err.message || "List failed" 
    });
  }
}



