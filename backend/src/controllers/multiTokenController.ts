/**
 * MultiToken 컨트롤러
 * 
 * 기능:
 * - 다중 토큰 팩토리를 통한 여러 종류의 토큰 관리
 * - 토큰 생성, 조회, 민팅, 전송
 * - 각 토큰별 독립적인 잔액 및 전송 관리
 * - 토큰 목록 조회 및 정보 관리
 * 
 * 지원 엔드포인트:
 * - POST /api/multi-token/create - 새 토큰 생성
 * - GET /api/multi-token/list - 모든 토큰 목록 조회
 * - GET /api/multi-token/info/:symbol - 특정 토큰 정보 조회
 * - GET /api/multi-token/balance/:symbol/:address - 특정 토큰 잔액 조회
 * - POST /api/multi-token/mint - 특정 토큰 민팅
 * - POST /api/multi-token/transfer - 특정 토큰 전송
 * - GET /api/multi-token/active - 활성 토큰 목록 조회
 */

import { Request, Response } from 'express';
import {
  createToken,
  getAllTokens,
  getTokenInfo,
  getTokenBalance,
  mintToken,
  transferToken,
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
 * 특정 토큰 전송
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function transferTokenBySymbol(req: Request, res: Response) {
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
    
    const txHash = await transferToken(symbol, to, amount);
    
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
    console.error('[MultiToken Controller] Transfer token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer token'
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
