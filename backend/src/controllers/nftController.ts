/**
 * NFT 관련 컨트롤러
 * 
 * 기능:
 * - 블록체인과의 상호작용 처리
 * - NFT 민팅, 소각, 조회
 * - NFT 거래 이력 조회
 * - 에러 처리 및 응답 포맷팅
 * 
 * 보안 특징:
 * - API 키 인증 필요
 * - 입력값 검증 및 형식 확인
 * - 블록체인 트랜잭션 에러 처리
 * 
 * 사용되는 스마트 컨트랙트 함수:
 * - mint(address to, string tokenURI) - NFT 생성
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
 * 토큰 ID 분석 컨트롤러
 * 
 * 토큰 ID에서 itemId와 인스턴스 번호를 추출합니다.
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { tokenId: number, itemId: number, instanceNumber: number } - 분석 결과
 */
export async function analyzeTokenIdController(req: Request, res: Response) {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    
    const numericTokenId = Number(tokenId);
    if (!Number.isInteger(numericTokenId) || numericTokenId < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    const contract = await getContract();
    
    // 컨트랙트에서 itemId와 인스턴스 번호 추출
    const [itemId, instanceNumber] = await Promise.all([
      contract.getItemId(BigInt(tokenId)),
      contract.getInstanceNumber(BigInt(tokenId))
    ]);
    
    return res.json({
      tokenId: numericTokenId,
      itemId: Number(itemId),
      instanceNumber: Number(instanceNumber),
      isLegacyToken: Number(itemId) === 0  // itemId가 0이면 기존 방식
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Token analysis failed" });
  }
}

/**
 * 아이템 발행량 조회 컨트롤러
 * 
 * 특정 itemId의 총 발행량을 조회합니다.
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { itemId: number, supply: number, nextInstance: number } - 발행량 정보
 */
export async function getItemSupplyController(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ error: "Missing itemId" });
    }
    
    const numericItemId = Number(itemId);
    if (!Number.isInteger(numericItemId) || numericItemId <= 0) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    const contract = await getContract();
    
    // 컨트랙트에서 발행량과 다음 인스턴스 번호 조회
    const [supply, nextInstance] = await Promise.all([
      contract.getItemSupply(BigInt(itemId)),
      contract.getNextInstanceNumber(BigInt(itemId))
    ]);
    
    return res.json({
      itemId: numericItemId,
      supply: Number(supply),
      nextInstance: Number(nextInstance)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Item supply query failed" });
  }
}

/**
 * 전체 NFT 통계 조회 컨트롤러
 * 
 * 전체 NFT의 발행량, 민팅량, 소각량을 조회합니다.
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { totalSupply: number, totalMinted: number, totalBurned: number } - 전체 통계
 */
export async function getTotalStatsController(req: Request, res: Response) {
  try {
    const contract = await getContract();
    
    // 컨트랙트에서 전체 통계 조회
    const [totalSupply, totalMinted, totalBurned] = await Promise.all([
      contract.totalSupply(),      // 현재 존재하는 NFT 수
      contract.totalMinted(),      // 총 민팅된 NFT 수
      contract.totalBurned()       // 총 소각된 NFT 수
    ]);
    
    return res.json({
      totalSupply: Number(totalSupply),
      totalMinted: Number(totalMinted),
      totalBurned: Number(totalBurned),
      burnRate: Number(totalMinted) > 0 ? (Number(totalBurned) / Number(totalMinted) * 100).toFixed(2) + '%' : '0%'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Total stats query failed" });
  }
}

/**
 * 여러 아이템 발행량 배치 조회 컨트롤러
 * 
 * 여러 itemId들의 발행량을 한 번에 조회합니다.
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { itemSupplies: Array<{itemId: number, supply: number}> } - 아이템별 발행량
 */
export async function getItemSuppliesBatchController(req: Request, res: Response) {
  try {
    const { itemIds } = req.body as { itemIds: number[] };
    
    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: "Missing or invalid itemIds array" });
    }
    
    if (itemIds.length === 0) {
      return res.json({ itemSupplies: [] });
    }
    
    if (itemIds.length > 100) {
      return res.status(400).json({ error: "Too many itemIds (max 100)" });
    }
    
    // itemId 유효성 검증
    for (const itemId of itemIds) {
      if (!Number.isInteger(itemId) || itemId <= 0) {
        return res.status(400).json({ error: `Invalid itemId: ${itemId}` });
      }
    }

    const contract = await getContract();
    
    // 컨트랙트에서 배치 조회
    const supplies = await contract.getItemSupplies(itemIds.map(id => BigInt(id)));
    
    const itemSupplies = itemIds.map((itemId, index) => ({
      itemId,
      supply: Number(supplies[index])
    }));
    
    return res.json({ itemSupplies });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Batch supply query failed" });
  }
}

/**
 * NFT 존재 여부 확인 컨트롤러
 * 
 * 특정 토큰 ID의 NFT가 존재하는지 확인합니다.
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { tokenId: number, exists: boolean } - 존재 여부
 */
export async function checkNftExistsController(req: Request, res: Response) {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    
    const numericTokenId = Number(tokenId);
    if (!Number.isInteger(numericTokenId) || numericTokenId < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    const contract = await getContract();
    
    // NFT 존재 여부 확인
    const exists = await contract.exists(BigInt(tokenId));
    
    return res.json({
      tokenId: numericTokenId,
      exists: exists
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "NFT existence check failed" });
  }
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
    
    // Java ContractNftRequest 구조에 맞게 파라미터 추출
    const { 
      walletAddress, 
      itemId, 
      userEquipItemId, 
      itemData,
      // 기존 방식도 지원 (하위 호환성)
      to,
      tokenURI 
    } = req.body as { 
      walletAddress?: string;
      itemId?: number;
      userEquipItemId?: number;
      itemData?: any;
      to?: string;
      tokenURI?: string;
    };
    
    // 주소 결정 (Java 방식 우선, 기존 방식 fallback)
    const targetAddress = walletAddress || to;
    
    // tokenURI 결정 (itemData를 JSON 문자열로 변환하거나 기존 tokenURI 사용)
    let finalTokenURI = tokenURI;
    if (itemData && !tokenURI) {
      // itemData가 있으면 JSON 문자열로 변환하여 tokenURI로 사용
      finalTokenURI = typeof itemData === 'string' ? itemData : JSON.stringify(itemData);
    }
    
    // 필수 파라미터 및 형식 검증
    console.log('[mint] 주소 검증 디버깅:', {
      walletAddress: walletAddress,
      to: to,
      targetAddress: targetAddress,
      typeof_targetAddress: typeof targetAddress,
      targetAddress_length: targetAddress?.length,
      regex_test: targetAddress ? /^0x[a-fA-F0-9]{40}$/.test(targetAddress) : false,
      itemId: itemId,
      userEquipItemId: userEquipItemId,
      itemData: itemData,
      finalTokenURI: finalTokenURI
    });
    
    // 지갑 주소 검증
    if (!targetAddress || typeof targetAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      console.log('[mint] 주소 검증 실패:', { targetAddress, type: typeof targetAddress });
      return res.status(400).json({ 
        error: "Invalid wallet address",
        details: {
          received: targetAddress,
          type: typeof targetAddress,
          length: targetAddress?.length,
          expected: "0x + 40 hex characters (total 42 chars)"
        }
      });
    }
    
    // tokenURI 검증
    if (!finalTokenURI || typeof finalTokenURI !== "string" || finalTokenURI.length > 2048) {
      return res.status(400).json({ 
        error: "Invalid tokenURI or itemData",
        details: {
          received: finalTokenURI,
          type: typeof finalTokenURI,
          length: finalTokenURI?.length,
          expected: "Valid URI string or JSON data (max 2048 chars)"
        }
      });
    }
    
    // Java 요청 전용 필드 검증 (선택사항)
    if (walletAddress && itemId !== undefined) {
      if (typeof itemId !== "number" || itemId <= 0) {
        return res.status(400).json({ 
          error: "Invalid itemId",
          details: {
            received: itemId,
            type: typeof itemId,
            expected: "Positive integer"
          }
        });
      }
    }
    
    if (walletAddress && userEquipItemId !== undefined) {
      if (typeof userEquipItemId !== "number" || userEquipItemId <= 0) {
        return res.status(400).json({ 
          error: "Invalid userEquipItemId",
          details: {
            received: userEquipItemId,
            type: typeof userEquipItemId,
            expected: "Positive integer"
          }
        });
      }
    }
    // URL 형식 검증 (itemData가 JSON인 경우는 스킵)
    if (!itemData) {
      try {
        const u = new URL(finalTokenURI);
        if (!["http:", "https:", "ipfs:"].includes(u.protocol)) {
          return res.status(400).json({ error: "Unsupported tokenURI scheme" });
        }
      } catch {
        return res.status(400).json({ error: "Malformed tokenURI" });
      }
    }

    // 블록체인 컨트랙트 인스턴스 생성 (백엔드에서 관리하는 컨트랙트 주소 사용)
    const contract = await getContract();

    // NFT 민팅 트랜잭션 실행
    console.log('[mint] Minting NFT to:', targetAddress, 'with URI:', finalTokenURI);
    
    let tx;
    if (itemId && typeof itemId === "number") {
      // itemId가 있으면 새로운 mintWithItemId 함수 사용
      console.log('[mint] Using mintWithItemId with itemId:', itemId);
      tx = await contract.mintWithItemId(targetAddress, finalTokenURI, itemId);
    } else {
      // itemId가 없으면 기존 mint 함수 사용 (하위 호환성)
      console.log('[mint] Using legacy mint function');
      tx = await contract.mint(targetAddress, finalTokenURI);
    }
    
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
    
    // 트랜잭션 해시, tokenId, 컨트랙트 주소 반환 (Java 요청 정보 포함)
    const payload = { 
      txHash: receipt?.hash ?? tx.hash,
      tokenId: tokenId,
      contractAddress: process.env.CONTRACT_ADDRESS || null,
      // Java 요청 정보 추가 (디버깅 및 추적용)
      ...(walletAddress && {
        mintedTo: targetAddress,
        itemId: itemId,
        userEquipItemId: userEquipItemId,
        itemDataIncluded: !!itemData
      })
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


