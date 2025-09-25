/**
 * ToreToken 컨트롤러 (레거시 - 단일 토큰 시스템)
 * 
 * 기능:
 * - ToreToken ERC-20 토큰 관련 API 엔드포인트 제공
 * - 토큰 잔액 조회, 민팅, 소각
 * - 게임 보상 지급 및 배치 전송
 * - 게임 컨트랙트 및 매니저 관리
 * - 지갑별 전송 내역 조회
 * 
 * 주의: 새로운 토큰 생성은 MultiTokenFactory 사용 권장
 * 
 * 지원 엔드포인트:
 * - GET /api/tore/balance/:address - 토큰 잔액 조회
 * - POST /api/tore/mint - 토큰 민팅
 * - POST /api/tore/burn - 토큰 소각
 * - POST /api/tore/reward - 게임 보상 지급
 * - POST /api/tore/batch-transfer - 배치 전송
 * - POST /api/tore/add-game-contract - 게임 컨트랙트 추가
 * - POST /api/tore/add-game-manager - 게임 매니저 추가
 * - GET /api/tore/info - 토큰 정보 조회
 * - GET /api/tore/history/:address - 지갑 전송 내역 조회
 */

import { Request, Response } from 'express';
import {
  getTokenBalance,
  distributeGameReward,
  batchTransfer,
  addGameContract,
  addGameManager,
  mintTokens,
  burnTokens,
  getTokenInfo as getToreTokenInfo,
  checkToreTokenConnection,
  getWalletTransferHistory
} from '../utils/toreToken';

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
        symbol: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token balance'
    });
  }
}

/**
 * 토큰 민팅
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function mint(req: Request, res: Response) {
  try {
    const { to, amount } = req.body;
    
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
        error: 'Invalid amount'
      });
    }
    
    const txHash = await mintTokens(to, amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        to,
        amount,
        symbol: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Mint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint tokens'
    });
  }
}

/**
 * 토큰 소각
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function burn(req: Request, res: Response) {
  try {
    const { amount } = req.body;
    
    // 입력 검증
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const txHash = await burnTokens(amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        amount,
        symbol: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Burn error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to burn tokens'
    });
  }
}

/**
 * 게임 보상 지급
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function distributeReward(req: Request, res: Response) {
  try {
    const { player, amount } = req.body;
    
    // 입력 검증
    if (!player || !player.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player address format'
      });
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const txHash = await distributeGameReward(player, amount);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        player,
        amount,
        symbol: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Distribute reward error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to distribute game reward'
    });
  }
}

/**
 * 배치 전송
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function batchTransferTokens(req: Request, res: Response) {
  try {
    const { recipients, amounts } = req.body;
    
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
    
    const txHash = await batchTransfer(recipients, amounts);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        recipientCount: recipients.length,
        symbol: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Batch transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch transfer tokens'
    });
  }
}

/**
 * 게임 컨트랙트 추가
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function addGameContractToToken(req: Request, res: Response) {
  try {
    const { contractAddress } = req.body;
    
    // 입력 검증
    if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contract address format'
      });
    }
    
    const txHash = await addGameContract(contractAddress);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        contractAddress
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Add game contract error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add game contract'
    });
  }
}

/**
 * 게임 매니저 추가
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function addGameManagerToToken(req: Request, res: Response) {
  try {
    const { managerAddress } = req.body;
    
    // 입력 검증
    if (!managerAddress || !managerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid manager address format'
      });
    }
    
    const txHash = await addGameManager(managerAddress);
    
    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        managerAddress
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Add game manager error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add game manager'
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
      data: tokenInfo
    });
  } catch (error) {
    console.error('[ToreToken Controller] Get token info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token information'
    });
  }
}

/**
 * 지갑 전송 내역 조회
 * 
 * @param req - Express 요청 객체
 * @param res - Express 응답 객체
 */
export async function getTransferHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { fromBlock, toBlock } = req.query;
    
    // 주소 형식 검증
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    const history = await getWalletTransferHistory(
      address,
      fromBlock ? parseInt(fromBlock as string) : 0,
      toBlock ? (toBlock as string) : 'latest'
    );
    
    res.json({
      success: true,
      data: {
        address,
        transfers: history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Get transfer history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transfer history'
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
        token: 'TORE'
      }
    });
  } catch (error) {
    console.error('[ToreToken Controller] Check connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check token connection'
    });
  }
}
