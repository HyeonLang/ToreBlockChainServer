/**
 * 마켓 컨트롤러
 * 
 * 기능:
 * - NFT 마켓 시스템 관련 API 엔드포인트 제공
 * - NFT 판매 등록, 등록 취소, 구매
 * - 마켓 상품 목록 조회
 * - 판매자/구매자 거래 내역 조회
 * - 마켓 통계 조회
 * 
 * 지원 엔드포인트:
 * - POST /api/market/list-nft - NFT 판매 등록
 * - POST /api/market/cancel-listing - 판매 등록 취소
 * - POST /api/market/buy-nft - NFT 구매
 * - GET /api/market/listings - 판매 중인 NFT 목록
 * - GET /api/market/listing/:listingId - 특정 판매 등록 정보
 * - GET /api/market/user-listings/:address - 사용자 판매 등록 목록
 * - GET /api/market/user-purchases/:address - 사용자 구매 내역
 * - GET /api/market/stats - 마켓 통계
 */

import { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

/**
 * NFT 판매 등록
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function listNFT(req: Request, res: Response) {
  try {
    const { tokenId, price, sellerAddress } = req.body;
    
    // 입력 검증
    if (!tokenId || isNaN(parseInt(tokenId)) || parseInt(tokenId) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token ID'
      });
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid price'
      });
    }
    
    if (!sellerAddress || !sellerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller address format'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // NFT 판매 등록 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션
    const listingId = Math.floor(Math.random() * 1000000) + 1;
    
    res.json({
      success: true,
      data: {
        listingId,
        tokenId: parseInt(tokenId),
        price: parseFloat(price),
        sellerAddress,
        status: 'active',
        createdAt: Date.now(),
        message: 'NFT listed for sale successfully. Please confirm the transaction in MetaMask.'
      }
    });
  } catch (error) {
    console.error('[Market Controller] List NFT error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list NFT for sale'
    });
  }
}

/**
 * 판매 등록 취소
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function cancelListing(req: Request, res: Response) {
  try {
    const { listingId, sellerAddress } = req.body;
    
    // 입력 검증
    if (!listingId || isNaN(parseInt(listingId)) || parseInt(listingId) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    if (!sellerAddress || !sellerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller address format'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // 판매 등록 취소 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션
    const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    res.json({
      success: true,
      data: {
        listingId: parseInt(listingId),
        sellerAddress,
        transactionHash,
        message: 'Listing cancelled successfully. Please confirm the transaction in MetaMask.'
      }
    });
  } catch (error) {
    console.error('[Market Controller] Cancel listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel listing'
    });
  }
}

/**
 * NFT 구매
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function buyNFT(req: Request, res: Response) {
  try {
    const { listingId, buyerAddress } = req.body;
    
    // 입력 검증
    if (!listingId || isNaN(parseInt(listingId)) || parseInt(listingId) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    if (!buyerAddress || !buyerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid buyer address format'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // NFT 구매 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션
    const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    res.json({
      success: true,
      data: {
        listingId: parseInt(listingId),
        buyerAddress,
        transactionHash,
        message: 'NFT purchased successfully. Please confirm the transaction in MetaMask.'
      }
    });
  } catch (error) {
    console.error('[Market Controller] Buy NFT error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to buy NFT'
    });
  }
}

/**
 * 판매 중인 NFT 목록 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getListings(req: Request, res: Response) {
  try {
    const { offset = '0', limit = '20', sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // 입력 검증
    const offsetNum = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid offset parameter'
      });
    }
    
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter (must be between 1 and 100)'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // 판매 중인 NFT 목록 조회 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션 데이터
    const listings = [
      {
        listingId: 1,
        tokenId: 1,
        seller: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        price: '100.0',
        tokenURI: 'https://ipfs.io/ipfs/QmExample1',
        createdAt: Date.now() - 86400000, // 1일 전
        status: 'active'
      },
      {
        listingId: 2,
        tokenId: 2,
        seller: '0x1234567890123456789012345678901234567890',
        price: '150.0',
        tokenURI: 'https://ipfs.io/ipfs/QmExample2',
        createdAt: Date.now() - 43200000, // 12시간 전
        status: 'active'
      },
      {
        listingId: 3,
        tokenId: 3,
        seller: '0x9876543210987654321098765432109876543210',
        price: '200.0',
        tokenURI: 'https://ipfs.io/ipfs/QmExample3',
        createdAt: Date.now() - 21600000, // 6시간 전
        status: 'active'
      }
    ];
    
    res.json({
      success: true,
      data: {
        listings,
        count: listings.length,
        offset: offsetNum,
        limit: limitNum,
        sortBy,
        order
      }
    });
  } catch (error) {
    console.error('[Market Controller] Get listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get listings'
    });
  }
}

/**
 * 특정 판매 등록 정보 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getListing(req: Request, res: Response) {
  try {
    const { listingId } = req.params;
    
    // 입력 검증
    if (!listingId || isNaN(parseInt(listingId)) || parseInt(listingId) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // 특정 판매 등록 정보 조회 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션 데이터
    const listingData = {
      listingId: parseInt(listingId),
      tokenId: 1,
      seller: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      price: '100.0',
      tokenURI: 'https://ipfs.io/ipfs/QmExample1',
      isActive: true,
      createdAt: Date.now() - 86400000,
      soldAt: 0
    };
    
    res.json({
      success: true,
      data: listingData
    });
  } catch (error) {
    console.error('[Market Controller] Get listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get listing information'
    });
  }
}

/**
 * 사용자 판매 등록 목록 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getUserListings(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { status = 'all' } = req.query;
    
    // 주소 형식 검증
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // 사용자 판매 등록 목록 조회 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션 데이터
    const userListings = [
      {
        listingId: 1,
        tokenId: 1,
        price: '100.0',
        status: 'active',
        createdAt: Date.now() - 86400000,
        soldAt: 0
      },
      {
        listingId: 2,
        tokenId: 2,
        price: '150.0',
        status: 'sold',
        createdAt: Date.now() - 172800000,
        soldAt: Date.now() - 86400000
      },
      {
        listingId: 3,
        tokenId: 3,
        price: '200.0',
        status: 'cancelled',
        createdAt: Date.now() - 259200000,
        soldAt: 0
      }
    ];
    
    // 상태별 필터링
    let filteredListings = userListings;
    if (status !== 'all') {
      filteredListings = userListings.filter(listing => listing.status === status);
    }
    
    res.json({
      success: true,
      data: {
        address,
        listings: filteredListings,
        count: filteredListings.length,
        status
      }
    });
  } catch (error) {
    console.error('[Market Controller] Get user listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user listings'
    });
  }
}

/**
 * 사용자 구매 내역 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getUserPurchases(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { offset = '0', limit = '20' } = req.query;
    
    // 주소 형식 검증
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    // 입력 검증
    const offsetNum = parseInt(offset as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid offset parameter'
      });
    }
    
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter (must be between 1 and 100)'
      });
    }
    
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // 사용자 구매 내역 조회 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션 데이터
    const purchases = [
      {
        listingId: 4,
        tokenId: 4,
        seller: '0x1111111111111111111111111111111111111111',
        price: '120.0',
        tokenURI: 'https://ipfs.io/ipfs/QmExample4',
        purchasedAt: Date.now() - 43200000 // 12시간 전
      },
      {
        listingId: 5,
        tokenId: 5,
        seller: '0x2222222222222222222222222222222222222222',
        price: '180.0',
        tokenURI: 'https://ipfs.io/ipfs/QmExample5',
        purchasedAt: Date.now() - 86400000 // 1일 전
      }
    ];
    
    res.json({
      success: true,
      data: {
        address,
        purchases,
        count: purchases.length,
        offset: offsetNum,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('[Market Controller] Get user purchases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user purchases'
    });
  }
}

/**
 * 마켓 통계 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getMarketStats(req: Request, res: Response) {
  try {
    // 마켓 컨트랙트 주소 확인
    const marketAddress = process.env.MARKET_CONTRACT_ADDRESS;
    if (!marketAddress) {
      return res.status(500).json({
        success: false,
        error: 'Market contract address not configured'
      });
    }
    
    // 마켓 통계 조회 로직 (실제 구현에서는 스마트 컨트랙트 호출)
    // 여기서는 시뮬레이션 데이터
    const stats = {
      totalListings: 25,
      activeListings: 8,
      soldListings: 15,
      cancelledListings: 2,
      totalVolume: '3500.0',
      averagePrice: '140.0',
      feePercentage: '2.5',
      marketAddress
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Market Controller] Get market stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market statistics'
    });
  }
}
