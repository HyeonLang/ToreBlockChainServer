/**
 * NFT 관련 컨트롤러
 * 
 * 기능:
 * - 블록체인과의 상호작용 처리
 * - NFT 민팅, 전송, 소각, 조회
 * - NFT 거래 이력 조회
 * - 에러 처리 및 응답 포맷팅
 * 
 * 보안 특징:
 * - JWT 또는 API 키 인증 필요
 * - 입력값 검증 및 형식 확인
 * - 블록체인 트랜잭션 에러 처리
 * 
 * 사용되는 스마트 컨트랙트 함수:
 * - mint(address to, string tokenURI) - NFT 생성
 * - transferFrom(address from, address to, uint256 tokenId) - NFT 전송
 * - burn(uint256 tokenId) - NFT 소각
 * - ownerOf(uint256 tokenId) - NFT 소유자 조회
 * - tokenURI(uint256 tokenId) - NFT 메타데이터 URI 조회
 * - balanceOf(address owner) - 지갑의 NFT 개수 조회
 * - tokenOfOwnerByIndex(address owner, uint256 index) - 지갑의 특정 인덱스 NFT 조회
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
 * 5. 트랜잭션 해시와 생성된 tokenId 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { txHash: string, tokenId: number } - 트랜잭션 해시와 토큰 ID
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function mintNftController(req: Request, res: Response) {
  try {
    console.log('[mint] request body:', req.body);
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
    console.log('[mint] tx sent:', tx.hash);
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    console.log('[mint] tx mined:', receipt?.hash);
    
    // Transfer 이벤트에서 tokenId 추출
    let tokenId: number | null = null;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog?.name === 'Transfer' && parsedLog.args) {
            tokenId = Number(parsedLog.args[2]); // tokenId는 세 번째 인자
            console.log('[mint] tokenId parsed:', tokenId);
            break;
          }
        } catch {
          // 로그 파싱 실패 시 무시하고 계속 진행
        }
      }
    }
    
    // 트랜잭션 해시, tokenId, 컨트랙트 주소 반환
    const payload = { 
      txHash: receipt?.hash ?? tx.hash,
      tokenId: tokenId,
      contractAddress: process.env.CONTRACT_ADDRESS || null
    };
    console.log('[mint] response:', payload);
    return res.json(payload);
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    console.error('[mint] error:', err);
    return res.status(500).json({ error: err.message || "Mint failed" });
  }
}

/**
 * NFT 전송 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 from(보내는 주소), to(받는 주소), tokenId 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. transferFrom 함수 호출하여 NFT 전송
 * 5. 트랜잭션 해시 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { txHash: string } - 트랜잭션 해시
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function transferNftController(req: Request, res: Response) {
  try {
    // 요청 본문에서 파라미터 추출
    const { from, to, tokenId } = req.body as { from: string; to: string; tokenId: string | number };
    
    // 필수 파라미터 및 형식 검증
    if (!from || typeof from !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(from)) {
      return res.status(400).json({ error: "Invalid 'from' address" });
    }
    if (!to || typeof to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({ error: "Invalid 'to' address" });
    }
    if (tokenId === undefined || tokenId === null) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    const numeric = typeof tokenId === "string" ? Number(tokenId) : tokenId;
    if (!Number.isInteger(numeric) || numeric < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // NFT 전송 트랜잭션 실행
    const tx = await contract.transferFrom(from, to, BigInt(tokenId));
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    
    // 트랜잭션 해시 반환
    return res.json({ txHash: receipt?.hash ?? tx.hash });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    return res.status(500).json({ error: err.message || "Transfer failed" });
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

/**
 * 지갑의 모든 NFT 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. 쿼리 파라미터에서 walletAddress 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. balanceOf로 소유한 NFT 개수 조회
 * 5. 각 NFT의 정보를 순회하며 조회
 * 6. NFT 정보 배열 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { nfts: Array<{tokenId: number, owner: string, tokenURI: string}> } - NFT 정보 배열
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function getWalletNftsController(req: Request, res: Response) {
  try {
    // 쿼리 파라미터에서 walletAddress 추출
    const { walletAddress } = req.query;
    
    // 필수 파라미터 및 형식 검증
    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // 지갑이 소유한 NFT 개수 조회
    const balance = await contract.balanceOf(walletAddress);
    const balanceNum = Number(balance);
    
    if (balanceNum === 0) {
      return res.json({ nfts: [] });
    }

    // 각 NFT의 정보를 조회
    const nfts = [];
    for (let i = 0; i < balanceNum; i++) {
      try {
        // tokenOfOwnerByIndex로 i번째 NFT의 tokenId 조회
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
        const tokenIdNum = Number(tokenId);
        
        // 해당 NFT의 소유자와 URI 조회
        const [owner, tokenURI] = await Promise.all([
          contract.ownerOf(tokenId),
          contract.tokenURI(tokenId)
        ]);
        
        nfts.push({
          tokenId: tokenIdNum,
          owner: owner,
          tokenURI: tokenURI
        });
      } catch (err) {
        console.warn(`Failed to get NFT at index ${i}:`, err);
        // 개별 NFT 조회 실패 시 무시하고 계속 진행
      }
    }
    
    // NFT 정보 배열 반환
    return res.json({ nfts });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    console.error('[getWalletNfts] error:', err);
    return res.status(500).json({ error: err.message || "Wallet NFTs query failed" });
  }
}

/**
 * NFT 개별 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. URL 파라미터에서 tokenId 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. ownerOf와 tokenURI 함수 호출하여 정보 조회
 * 5. 소유자 주소와 메타데이터 URI 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { owner: string, tokenURI: string } - 소유자 주소와 메타데이터 URI
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function getNftController(req: Request, res: Response) {
  try {
    // URL 파라미터에서 tokenId 추출
    const { tokenId } = req.params;
    
    // 필수 파라미터 및 형식 검증
    if (!tokenId) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    const numeric = Number(tokenId);
    if (!Number.isInteger(numeric) || numeric < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // NFT 정보 조회 (가스 비용 없음 - view 함수)
    const [owner, tokenURI] = await Promise.all([
      contract.ownerOf(BigInt(tokenId)),
      contract.tokenURI(BigInt(tokenId))
    ]);
    
    // 소유자 주소와 메타데이터 URI 반환
    return res.json({ 
      owner: owner,
      tokenURI: tokenURI
    });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    return res.status(500).json({ error: err.message || "NFT query failed" });
  }
}

/**
 * NFT 거래 이력 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. URL 파라미터에서 tokenId 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. Transfer 이벤트 로그 조회
 * 5. 거래 이력 배열 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { transactions: Array<{from: string, to: string, txHash: string, blockNumber: number, timestamp: number}> } - 거래 이력
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function getNftTransactionHistoryController(req: Request, res: Response) {
  try {
    // URL 파라미터에서 tokenId 추출
    const { tokenId } = req.params;
    
    // 필수 파라미터 및 형식 검증
    if (!tokenId) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    const numeric = Number(tokenId);
    if (!Number.isInteger(numeric) || numeric < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // Transfer 이벤트 필터 생성 (특정 토큰 ID)
    const filter = contract.filters.Transfer(null, null, BigInt(tokenId));
    
    // 이벤트 로그 조회
    const logs = await contract.queryFilter(filter);
    
    // 거래 이력 배열 생성
    const transactions = [];
    for (const log of logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'Transfer') {
          const [from, to, tokenIdFromLog] = parsedLog.args;
          
          // 블록 정보 조회
          const block = await log.getBlock();
          
          transactions.push({
            from: from,
            to: to,
            tokenId: Number(tokenIdFromLog),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: block.timestamp,
            type: from === '0x0000000000000000000000000000000000000000' ? 'mint' : 
                  to === '0x0000000000000000000000000000000000000000' ? 'burn' : 'transfer'
          });
        }
      } catch (err) {
        console.warn('Failed to parse log:', err);
        // 개별 로그 파싱 실패 시 무시하고 계속 진행
      }
    }
    
    // 시간순 정렬 (오래된 것부터)
    transactions.sort((a, b) => a.blockNumber - b.blockNumber);
    
    // 거래 이력 배열 반환
    return res.json({ 
      tokenId: numeric,
      transactions: transactions
    });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    console.error('[getNftTransactionHistory] error:', err);
    return res.status(500).json({ error: err.message || "NFT transaction history query failed" });
  }
}

/**
 * 지갑 NFT 거래 이력 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. 쿼리 파라미터에서 walletAddress 추출
 * 2. 필수 파라미터 검증
 * 3. 블록체인 컨트랙트 인스턴스 생성
 * 4. Transfer 이벤트 로그 조회 (해당 지갑 관련)
 * 5. 거래 이력 배열 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { transactions: Array<{from: string, to: string, tokenId: number, txHash: string, blockNumber: number, timestamp: number}> } - 거래 이력
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function getWalletTransactionHistoryController(req: Request, res: Response) {
  try {
    // 쿼리 파라미터에서 walletAddress 추출
    const { walletAddress } = req.query;
    
    // 필수 파라미터 및 형식 검증
    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // 블록체인 컨트랙트 인스턴스 생성
    const contract = await getContract();
    
    // Transfer 이벤트 필터 생성 (해당 지갑이 from 또는 to인 경우)
    const filter = contract.filters.Transfer(walletAddress, walletAddress);
    
    // 이벤트 로그 조회
    const logs = await contract.queryFilter(filter);
    
    // 거래 이력 배열 생성
    const transactions = [];
    for (const log of logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'Transfer') {
          const [from, to, tokenId] = parsedLog.args;
          
          // 블록 정보 조회
          const block = await log.getBlock();
          
          transactions.push({
            from: from,
            to: to,
            tokenId: Number(tokenId),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: block.timestamp,
            type: from === '0x0000000000000000000000000000000000000000' ? 'mint' : 
                  to === '0x0000000000000000000000000000000000000000' ? 'burn' : 'transfer',
            direction: from.toLowerCase() === walletAddress.toLowerCase() ? 'sent' : 'received'
          });
        }
      } catch (err) {
        console.warn('Failed to parse log:', err);
        // 개별 로그 파싱 실패 시 무시하고 계속 진행
      }
    }
    
    // 시간순 정렬 (최신 것부터)
    transactions.sort((a, b) => b.blockNumber - a.blockNumber);
    
    // 거래 이력 배열 반환
    return res.json({ 
      walletAddress: walletAddress,
      transactions: transactions
    });
  } catch (err: any) {
    // 에러 처리 및 500 상태코드로 응답
    console.error('[getWalletTransactionHistory] error:', err);
    return res.status(500).json({ error: err.message || "Wallet transaction history query failed" });
  }
}


