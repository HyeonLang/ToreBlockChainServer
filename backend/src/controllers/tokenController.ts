/**
 * Token Controller
 * 
 * 기능:
 * - 토큰 발행 (Mint) API 엔드포인트 제공
 * - 토큰 전송 (Transfer) API 엔드포인트 제공
 * - 입력 검증 및 에러 핸들링
 * - 블록체인 트랜잭션 처리
 * 
 * 지원 엔드포인트:
 * - POST /api/tokens/mint - 토큰 발행
 * - POST /api/tokens/transfer - 토큰 전송
 * - GET /api/tokens/balance/:address - 토큰 잔액 조회
 * - GET /api/tokens/info - 토큰 정보 조회
 */

import { Request, Response } from 'express';
import {
  getTokenBalance,
  transferTokens,
  mintTokens,
  getTokenInfo as getToreTokenInfo,
  checkToreTokenConnection
} from '../utils/toreToken';

/**
 * 토큰 발행 (Mint)
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function mintToken(req: Request, res: Response) {
  try {
    const { to, amount, reason } = req.body;
    
    // 입력 검증
    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address format'
      });
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Amount must be a positive number'
      });
    }
    
    // 토큰 발행 실행
    const txHash = await mintTokens(to, amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        to,
        amount,
        reason: reason || 'manual_mint',
        symbol: 'TORE',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Token Controller] Mint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 토큰 전송 (Transfer)
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function transferToken(req: Request, res: Response) {
  try {
    const { to, amount, from, reason } = req.body;
    
    // 입력 검증
    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address format'
      });
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Amount must be a positive number'
      });
    }
    
    // 토큰 전송 실행
    const txHash = await transferTokens(to, amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        from: from || 'server_wallet',
        to,
        amount,
        reason: reason || 'manual_transfer',
        symbol: 'TORE',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Token Controller] Transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 토큰 잔액 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getBalance(req: Request, res: Response) {
  try {
    const { address } = req.params;
    
    // 주소 형식 검증
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    const balance = await getTokenBalance(address);
    
    res.json({
      success: true,
      data: {
        address,
        balance,
        symbol: 'TORE',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Token Controller] Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 토큰 정보 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getTokenInfo(req: Request, res: Response) {
  try {
    const tokenInfo = await getToreTokenInfo();
    
    res.json({
      success: true,
      data: {
        ...tokenInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Token Controller] Get token info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 토큰 연결 상태 확인
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function checkConnection(req: Request, res: Response) {
  try {
    const isConnected = await checkToreTokenConnection();
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        token: 'TORE',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Token Controller] Check connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check token connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * 배치 토큰 발행
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function batchMintTokens(req: Request, res: Response) {
  try {
    const { recipients, amounts, reason } = req.body;
    
    // 입력 검증
    if (!Array.isArray(recipients) || !Array.isArray(amounts)) {
      return res.status(400).json({
        success: false,
        error: 'Recipients and amounts must be arrays'
      });
    }
    
    if (recipients.length !== amounts.length) {
      return res.status(400).json({
        success: false,
        error: 'Recipients and amounts arrays must have the same length'
      });
    }
    
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Arrays cannot be empty'
      });
    }
    
    // 주소 및 금액 검증
    for (let i = 0; i < recipients.length; i++) {
      if (!recipients[i] || !recipients[i].match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          success: false,
          error: `Invalid recipient address at index ${i}`
        });
      }
      
      if (!amounts[i] || isNaN(parseFloat(amounts[i])) || parseFloat(amounts[i]) <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid amount at index ${i}`
        });
      }
    }
    
    // 배치 발행 실행
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      try {
        const txHash = await mintTokens(recipients[i], amounts[i]);
        results.push({
          recipient: recipients[i],
          amount: amounts[i],
          transactionHash: txHash,
          success: true
        });
      } catch (error) {
        results.push({
          recipient: recipients[i],
          amount: amounts[i],
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      data: {
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        results,
        reason: reason || 'batch_mint',
        symbol: 'TORE',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Token Controller] Batch mint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch mint tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
