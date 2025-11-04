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
import { getContract, getVaultContract, getWallet } from "../utils/contract";
import { uploadJsonToPinata, testPinataConnection } from "../utils/pinata";

/**
 * 구조화된 메타데이터 형식을 검증하는 함수
 * 
 * @param itemData - 검증할 메타데이터 객체
 * @returns 검증 결과와 오류 메시지들
 */
function validateStructuredMetadata(itemData: any): {isValid: boolean, errors: string[]} {
  const errors: string[] = [];
  
  // 필수 필드 검증
  if (!itemData.name || typeof itemData.name !== 'string') {
    errors.push("name is required and must be a string");
  }
  
  // type은 필수
  if (!itemData.type || typeof itemData.type !== 'string') {
    errors.push("type is required and must be a string");
  }
  
  // baseStats는 필수 (객체)
  if (!itemData.baseStats || typeof itemData.baseStats !== 'object' || Array.isArray(itemData.baseStats)) {
    errors.push("baseStats is required and must be an object");
  }
  
  // image는 필수 (ipfs:// 또는 https:// 형식)
  if (!itemData.image || typeof itemData.image !== 'string') {
    errors.push("image is required and must be a string");
  } else {
    // image 형식 검증 (ipfs:// 또는 https://로 시작)
    if (!itemData.image.startsWith('ipfs://') && !itemData.image.startsWith('https://')) {
      errors.push("image must start with 'ipfs://' or 'https://'");
    }
  }
  
  // 권장 필드 검증 (없어도 에러는 아님, 하지만 있으면 형식 확인)
  if (itemData.description !== undefined && typeof itemData.description !== 'string') {
    errors.push("description must be a string if provided");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}


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
      itemDefId, 
      equipItemId, 
      itemData,
      metadataUrl
    } = req.body as { 
      walletAddress?: string;
      itemDefId?: number;
      equipItemId?: number;
      itemData?: any;
      metadataUrl?: string;
    };
    
    // 주소 결정
    const targetAddress = walletAddress;
    
    // tokenURI 결정 (구조화된 메타데이터 처리)
    let finalTokenURI: string;
    let structuredMetadata = null;
    
    if (itemData) {
      if (typeof itemData === 'string') {
        // 이미 IPFS URI나 URL 형태면 그대로 사용
        finalTokenURI = itemData;
      } else {
        // 구조화된 메타데이터 형식 검증
        const validationResult = validateStructuredMetadata(itemData);
        if (!validationResult.isValid) {
          return res.status(400).json({
            error: "Invalid structured metadata format",
            details: validationResult.errors
          });
        }
        
        // 검증된 메타데이터를 저장 (나중에 nft_id 업데이트용)
        structuredMetadata = itemData;
        
        // 표준 NFT 메타데이터 형식으로 구성
        // OpenSea 및 기타 마켓플레이스 표준 준수
        const nftMetadata: any = {
          // 필수 필드
          name: itemData.name,
          image: itemData.image,
          // 권장 필드
          description: itemData.description || '',
          external_url: metadataUrl || itemData.external_url || '',
          attributes: []
        };
        
        // attributes 구성
        // 1. itemDefId
        if (itemDefId !== undefined && itemDefId !== null) {
          nftMetadata.attributes.push({
            trait_type: "Item Def ID",
            value: itemDefId,
            display_type: "number"
          });
        }
        
        // 2. equipItemId
        if (equipItemId !== undefined && equipItemId !== null) {
          nftMetadata.attributes.push({
            trait_type: "Equip Item ID",
            value: equipItemId,
            display_type: "number"
          });
        }
        
        // 3. type
        if (itemData.type) {
          nftMetadata.attributes.push({
            trait_type: "Type",
            value: itemData.type
          });
        }
        
        // 4. baseStats의 각 속성
        if (itemData.baseStats && typeof itemData.baseStats === 'object') {
          Object.entries(itemData.baseStats).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              nftMetadata.attributes.push({
                trait_type: key.charAt(0).toUpperCase() + key.slice(1),  // 첫 글자 대문자
                value: value,
                display_type: typeof value === 'number' ? "number" : undefined
              });
            }
          });
        }
        
        // animation_url이 있으면 추가
        if (itemData.animation_url) {
          nftMetadata.animation_url = itemData.animation_url;
        }
        
        // Pinata에 JSON 업로드하고 IPFS URI 받기
        try {
          console.log('[mint] Uploading metadata to Pinata...');
          
          // 메타데이터 이름: itemDefId-equipItemId (간결하고 의미있음)
          const metadataName = `${itemDefId}-${equipItemId}`;
          
          finalTokenURI = await uploadJsonToPinata(nftMetadata, metadataName);
          console.log('[mint] Metadata uploaded to IPFS:', finalTokenURI);
        } catch (uploadError: any) {
          console.error('[mint] Pinata upload failed:', uploadError);
          const errorMessage = uploadError?.message || String(uploadError) || 'Unknown error';
          return res.status(500).json({
            error: "Failed to upload metadata to IPFS",
            details: errorMessage
          });
        }
      }
    } else {
      return res.status(400).json({
        error: "itemData is required",
        details: "itemData must be provided for NFT minting"
      });
    }
    
    // 필수 파라미터 및 형식 검증
    console.log('[mint] 주소 검증 디버깅:', {
      walletAddress: walletAddress,
      targetAddress: targetAddress,
      typeof_targetAddress: typeof targetAddress,
      targetAddress_length: targetAddress?.length,
      regex_test: targetAddress ? /^0x[a-fA-F0-9]{40}$/.test(targetAddress) : false,
      itemDefId: itemDefId,
      equipItemId: equipItemId,
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
    
    // itemDefId 필수 검증
    if (!itemDefId || typeof itemDefId !== "number" || itemDefId <= 0) {
      return res.status(400).json({ 
        error: "Invalid itemDefId",
        details: {
          received: itemDefId,
          type: typeof itemDefId,
          expected: "Positive integer"
        }
      });
    }
    
    if (walletAddress && equipItemId !== undefined) {
      if (typeof equipItemId !== "number" || equipItemId <= 0) {
        return res.status(400).json({ 
          error: "Invalid equipItemId",
          details: {
            received: equipItemId,
            type: typeof equipItemId,
            expected: "Positive integer"
          }
        });
      }
    }
    // itemData가 항상 제공되므로 URL 형식 검증은 불필요

    // 블록체인 컨트랙트 인스턴스 생성 (백엔드에서 관리하는 컨트랙트 주소 사용)
    const contract = await getContract();

    // 컨트랙트 소유자 확인
    try {
      const owner = await contract.owner();
      const wallet = await getWallet();
      console.log('[mint] Contract owner:', owner);
      console.log('[mint] Server wallet:', wallet.address);
      console.log('[mint] Owner match:', owner.toLowerCase() === wallet.address.toLowerCase());
      
      if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        return res.status(403).json({
          error: "Server wallet is not the contract owner",
          details: {
            contractOwner: owner,
            serverWallet: wallet.address,
            message: "The server wallet must be the contract owner to mint NFTs"
          }
        });
      }
    } catch (ownerCheckError: any) {
      console.error('[mint] Owner check failed:', ownerCheckError);
      // Owner 확인 실패해도 계속 진행 (컨트랙트가 없는 경우일 수 있음)
    }
    
    // NFT 민팅 트랜잭션 실행 (mintWithItemId만 사용)
    console.log('[mint] Minting NFT to:', targetAddress, 'with itemDefId:', itemDefId, 'URI:', finalTokenURI);
    
    let tx;
    try {
      // 가스 추정 먼저 시도
      const estimatedGas = await contract.mintWithItemId.estimateGas(targetAddress, finalTokenURI, itemDefId);
      console.log('[mint] Estimated gas:', estimatedGas.toString());
      
      tx = await contract.mintWithItemId(targetAddress, finalTokenURI, itemDefId);
      console.log('[mint] tx sent:', tx.hash);
    } catch (txError: any) {
      console.error('[mint] Transaction error:', txError);
      const errorMessage = txError?.reason || txError?.message || String(txError);
      return res.status(500).json({
        error: "Failed to execute mint transaction",
        details: errorMessage,
        possibleCauses: [
          "Contract not deployed at this address",
          "Server wallet is not the contract owner",
          "Insufficient gas or network connection issue",
          "Contract function does not exist"
        ]
      });
    }
    
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
      tokenURI: finalTokenURI, // IPFS URI 포함
      contractAddress: process.env.CONTRACT_ADDRESS || null,
      // 요청 정보 추가 (디버깅 및 추적용)
      ...(walletAddress && {
        mintedTo: targetAddress,
        itemDefId: itemDefId,
        equipItemId: equipItemId,
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

/**
 * NFT 락업 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 walletAddress와 tokenId 추출
 * 2. 필수 파라미터 검증
 * 3. NFT 컨트랙트 인스턴스 생성 (approve 확인용)
 * 4. Vault 컨트랙트 인스턴스 생성
 * 5. NFT 소유자 확인
 * 6. lockNft 함수 호출하여 NFT 락업
 * 7. 트랜잭션 해시 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { txHash: string } - 트랜잭션 해시
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function lockNftController(req: Request, res: Response) {
  try {
    const { walletAddress, tokenId } = req.body as { 
      walletAddress: string; 
      tokenId: string | number 
    };
    
    // 필수 파라미터 검증
    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    
    if (tokenId === undefined || tokenId === null) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    const numericTokenId = typeof tokenId === "string" ? Number(tokenId) : tokenId;
    if (!Number.isInteger(numericTokenId) || numericTokenId < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    const nftContract = await getContract();
    const vaultContract = await getVaultContract();
    const nftContractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!nftContractAddress) {
      return res.status(500).json({ error: "CONTRACT_ADDRESS not configured" });
    }
    
    // ⚠️ 주의: 현재 구현은 서버 측 지갑을 사용합니다
    // 이 방식은 보안상 권장되지 않으며, 다음 두 가지 방법 중 하나를 사용해야 합니다:
    // 1. 사용자가 프론트엔드에서 직접 approve하고 락업 호출
    // 2. 서명된 메시지 방식 사용
    
    // NFT 소유자 확인
    const owner = await nftContract.ownerOf(BigInt(numericTokenId));
    const isServerOwner = owner.toLowerCase() === walletAddress.toLowerCase();
    
    // 백엔드 지갑이 소유자인 경우에만 락업 진행
    if (!isServerOwner) {
      return res.status(400).json({ 
        error: "Server wallet must own the NFT to lock it",
        details: {
          requestedOwner: walletAddress,
          actualOwner: owner,
          instructions: "Please transfer the NFT to the server wallet first, or use frontend to lock directly"
        }
      });
    }
    
    // NFT 락업 트랜잭션 실행 (서버가 소유자이므로 서버가 호출)
    const tx = await vaultContract.lockNft(nftContractAddress, BigInt(numericTokenId));
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    
    return res.json({ 
      txHash: receipt?.hash ?? tx.hash,
      vaultAddress: process.env.VAULT_ADDRESS || null,
      message: "NFT locked successfully. The NFT is now in the vault."
    });
  } catch (err: any) {
    console.error('[lockNft] error:', err);
    return res.status(500).json({ error: err.message || "Lock NFT failed" });
  }
}

/**
 * NFT 락업 해제 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 walletAddress와 tokenId 추출
 * 2. 필수 파라미터 검증
 * 3. Vault 컨트랙트 인스턴스 생성
 * 4. unlockNft 함수 호출하여 NFT 락업 해제
 * 5. 트랜잭션 해시 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { txHash: string } - 트랜잭션 해시
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function unlockNftController(req: Request, res: Response) {
  try {
    const { walletAddress, tokenId } = req.body as { 
      walletAddress: string; 
      tokenId: string | number 
    };
    
    // 필수 파라미터 검증
    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    
    if (tokenId === undefined || tokenId === null) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    const numericTokenId = typeof tokenId === "string" ? Number(tokenId) : tokenId;
    if (!Number.isInteger(numericTokenId) || numericTokenId < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }

    const vaultContract = await getVaultContract();
    const nftContractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!nftContractAddress) {
      return res.status(500).json({ error: "CONTRACT_ADDRESS not configured" });
    }
    
    // ⚠️ 주의: unlockNft는 Vault 컨트랙트의 함수이며, msg.sender가 보관한 NFT만 꺼낼 수 있습니다
    // 현재 구현은 서버가 락업했을 때만 작동합니다
    // 서버가 락업한 NFT를 서버 지갑으로 락업 해제합니다
    
    // NFT 락업 해제 트랜잭션 실행
    const tx = await vaultContract.unlockNft(nftContractAddress, BigInt(numericTokenId));
    
    // 트랜잭션 완료 대기 및 영수증 획득
    const receipt = await tx.wait();
    
    return res.json({ 
      txHash: receipt?.hash ?? tx.hash,
      vaultAddress: process.env.VAULT_ADDRESS || null,
      message: "NFT unlocked successfully. The NFT is now back to the server wallet and will be returned to you."
    });
  } catch (err: any) {
    console.error('[unlockNft] error:', err);
    return res.status(500).json({ error: err.message || "Unlock NFT failed" });
  }
}

/**
 * Vault에 보관된 NFT 목록 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. 쿼리 파라미터에서 walletAddress 추출
 * 2. 필수 파라미터 검증
 * 3. Vault 컨트랙트 인스턴스 생성
 * 4. getVaultedTokens 함수 호출하여 보관된 NFT 목록 조회
 * 5. NFT 목록 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns { vaultedNfts: Array<number> } - 보관된 NFT 토큰 ID 배열
 * @throws 400 - 필수 파라미터 누락 시
 * @throws 500 - 블록체인 상호작용 실패 시
 */
export async function getVaultedNftsController(req: Request, res: Response) {
  try {
    const { walletAddress } = req.query;
    
    // 필수 파라미터 및 형식 검증
    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const vaultContract = await getVaultContract();
    const nftContractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!nftContractAddress) {
      return res.status(500).json({ error: "CONTRACT_ADDRESS not configured" });
    }
    
    // Vault에 보관된 NFT 목록 조회
    const vaultedTokens = await vaultContract.getVaultedTokens(walletAddress, nftContractAddress);
    
    const tokenIds = vaultedTokens.map((tokenId: bigint) => Number(tokenId));
    
    return res.json({ 
      walletAddress: walletAddress,
      nftContract: nftContractAddress,
      vaultAddress: process.env.VAULT_ADDRESS || null,
      vaultedNfts: tokenIds
    });
  } catch (err: any) {
    console.error('[getVaultedNfts] error:', err);
    return res.status(500).json({ error: err.message || "Get vaulted NFTs query failed" });
  }
}

/**
 * Pinata 연결 테스트 컨트롤러
 * 
 * 실행 흐름:
 * 1. Pinata API 키 확인
 * 2. Pinata 인증 테스트
 * 3. 연결 상태 반환
 * 
 * @param _req - Express Request 객체 (사용하지 않음)
 * @param res - Express Response 객체
 * @returns { success: boolean, message: string } - 연결 상태
 */
export async function testPinataController(_req: Request, res: Response) {
  try {
    const hasApiKeys = !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY);
    
    if (!hasApiKeys) {
      return res.status(400).json({
        success: false,
        message: "Pinata API keys not configured",
        hint: "Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env file"
      });
    }
    
    const isConnected = await testPinataConnection();
    
    if (isConnected) {
      return res.json({
        success: true,
        message: "Pinata connection successful"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Pinata authentication failed"
      });
    }
  } catch (err: any) {
    console.error('[testPinata] error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || "Pinata test failed"
    });
  }
}

