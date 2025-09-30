/**
 * MultiToken 컨트롤러 - ERC-20 토큰 발행 및 관리 시스템
 * 
 * 기능:
 * - MultiTokenFactory 스마트 컨트랙트를 통한 다중 ERC-20 토큰 관리
 * - 새로운 토큰 생성 및 배포 (이름, 심볼, 소수점, 초기 공급량 설정)
 * - 토큰별 독립적인 민팅(발급), 소각(burn) 기능
 * - 토큰 정보 조회 (이름, 심볼, 컨트랙트 주소, 총 공급량 등)
 * - 지갑별 토큰 잔액 조회 및 관리
 * - 팩토리 컨트랙트 연결 상태 모니터링
 * 
 * 지원 API 엔드포인트:
 * - POST /api/multi-token/create - 새 ERC-20 토큰 생성 및 배포
 * - GET /api/multi-token/list - 생성된 모든 토큰 목록 조회
 * - GET /api/multi-token/active - 활성 상태인 토큰 목록 조회
 * - GET /api/multi-token/info/:symbol - 특정 토큰의 상세 정보 조회
 * - GET /api/multi-token/balance/:symbol/:address - 특정 지갑의 토큰 잔액 조회
 * - POST /api/multi-token/mint - 특정 토큰의 추가 발급(민팅)
 * - POST /api/multi-token/burn - 특정 토큰의 소각(토큰 삭제)
 * - GET /api/multi-token/connection - 팩토리 컨트랙트 연결 상태 확인
 * 
 * 특징:
 * - 각 토큰은 독립적인 컨트랙트 주소를 가짐
 * - 토큰별 고유한 이름, 심볼, 소수점 설정 가능
 * - ERC-20 표준을 완전히 준수하는 토큰 생성
 * - 블록체인 트랜잭션 해시 반환으로 추적 가능
 * 
 * 사용 예시:
 * - 게임 내 화폐, 보상 토큰, 스테이킹 토큰 등 다양한 용도의 토큰 생성
 * - 게임 보상 지급을 위한 토큰 민팅
 * - 토큰 경제 조절을 위한 소각 기능
 */

import { Request, Response } from 'express';
import {
  createToken,
  getAllTokens,
  getTokenInfo,
  getTokenBalance,
  mintToken,
  burnToken,
  getActiveTokens,
  checkFactoryConnection
} from '../utils/multiToken';

/**
 * 새 토큰 생성
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function createNewToken(req: Request, res: Response) {
  try {
    const { name, symbol, decimals = 18, initialSupply, owner } = req.body;
    
    // 입력 검증
    if (!name || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Token name and symbol are required'
      });
    }
    
    if (!initialSupply || isNaN(parseFloat(initialSupply)) || parseFloat(initialSupply) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid initial supply is required'
      });
    }
    
    // 토큰 생성
    const tokenAddress = await createToken(name, symbol, decimals, initialSupply, owner);
    
    res.json({
      success: true,
      data: {
        name,
        symbol,
        contractAddress: tokenAddress,
        initialSupply,
        decimals,
        owner: owner || 'Factory Owner'
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Create token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create token'
    });
  }
}

/**
 * 모든 토큰 목록 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getAllTokensList(req: Request, res: Response) {
  try {
    const tokens = await getAllTokens();
    
    res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Get all tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tokens list'
    });
  }
}

/**
 * 활성 토큰 목록 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getActiveTokensList(req: Request, res: Response) {
  try {
    const tokens = await getActiveTokens();
    
    res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Get active tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active tokens list'
    });
  }
}

/**
 * 특정 토큰 정보 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getTokenInfoBySymbol(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol is required'
      });
    }
    
    const tokenInfo = await getTokenInfo(symbol);
    
    res.json({
      success: true,
      data: tokenInfo
    });
  } catch (error) {
    console.error('[MultiToken Controller] Get token info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token information'
    });
  }
}

/**
 * 특정 토큰 잔액 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getTokenBalanceBySymbol(req: Request, res: Response) {
  try {
    const { symbol, address } = req.params;
    
    // 입력 검증
    if (!symbol || !address) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol and address are required'
      });
    }
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    const balance = await getTokenBalance(symbol, address);
    
    res.json({
      success: true,
      data: {
        symbol,
        address,
        balance
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Get token balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token balance'
    });
  }
}

/**
 * 특정 토큰 민팅
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function mintTokenBySymbol(req: Request, res: Response) {
  try {
    const { symbol, to, amount } = req.body;
    
    // 입력 검증
    if (!symbol || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol, recipient address, and amount are required'
      });
    }
    
    if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address format'
      });
    }
    
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const txHash = await mintToken(symbol, to, amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        symbol,
        to,
        amount
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Mint token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint token'
    });
  }
}

/**
 * 특정 토큰 소각
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function burnTokenBySymbol(req: Request, res: Response) {
  try {
    const { symbol, amount } = req.body;
    
    // 입력 검증
    if (!symbol || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol and amount are required'
      });
    }
    
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const txHash = await burnToken(symbol, amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        symbol,
        amount
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Burn token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to burn token'
    });
  }
}

/**
 * 팩토리 연결 상태 확인
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function checkFactoryConnectionStatus(req: Request, res: Response) {
  try {
    const isConnected = await checkFactoryConnection();
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        factory: 'MultiTokenFactory'
      }
    });
  } catch (error) {
    console.error('[MultiToken Controller] Check connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check factory connection'
    });
  }
}
