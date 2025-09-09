/**
 * API 키 인증 미들웨어
 * 
 * 기능:
 * - x-api-key 헤더를 통한 API 키 인증
 * - 환경변수 API_KEY와 비교
 * - API_KEY가 설정되지 않으면 인증 생략
 * 
 * 사용법:
 * - API 키 인증이 필요한 라우트에 적용
 * - JWT 인증과 함께 사용 가능
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 */

import { Request, Response, NextFunction } from "express";

/**
 * API 키 인증 미들웨어
 * 
 * 실행 흐름:
 * 1. 환경변수에서 API_KEY 확인
 * 2. API_KEY가 없으면 인증 생략 (개발 환경)
 * 3. 요청 헤더에서 x-api-key 추출
 * 4. API 키 비교 및 검증
 * 5. 유효하면 다음 미들웨어로 진행
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 * 
 * 사용 예시:
 * ```typescript
 * app.use('/api/protected', apiKeyAuth);
 * app.get('/api/data', apiKeyAuth, dataController);
 * ```
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // 환경변수에서 API 키 확인
    const configuredKey = process.env.API_KEY;
    
    // API 키가 설정되지 않았으면 인증 생략 (개발 환경)
    if (!configuredKey) {
      console.log('[API Key Auth] No API key configured, skipping authentication');
      return next();
    }

    // 요청 헤더에서 API 키 추출
    const providedKey = req.header("x-api-key");
    
    if (!providedKey) {
      console.log('[API Key Auth] No API key provided in x-api-key header');
      return res.status(401).json({ 
        error: "API key required. Please provide x-api-key header.",
        code: "API_KEY_REQUIRED"
      });
    }

    // API 키 검증
    if (providedKey !== configuredKey) {
      console.log('[API Key Auth] Invalid API key provided');
      return res.status(401).json({ 
        error: "Invalid API key.",
        code: "INVALID_API_KEY"
      });
    }

    console.log('[API Key Auth] API key authentication successful');
    return next();
    
  } catch (error) {
    console.error('[API Key Auth] Authentication error:', error);
    return res.status(500).json({ 
      error: "Internal server error during API key authentication.",
      code: "API_KEY_AUTH_ERROR"
    });
  }
}

/**
 * JWT 또는 API 키 인증 미들웨어
 * 
 * JWT 토큰이 있으면 JWT 인증, 없으면 API 키 인증
 * 두 인증 방식 중 하나라도 성공하면 통과
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 */
export function jwtOrApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT 토큰이 있으면 JWT 인증 시도
      console.log('[Auth] JWT token found, attempting JWT authentication');
      const { authenticateJWT } = require('./jwtAuth');
      return authenticateJWT(req, res, next);
    } else {
      // JWT 토큰이 없으면 API 키 인증 시도
      console.log('[Auth] No JWT token found, attempting API key authentication');
      return apiKeyAuth(req, res, next);
    }
    
  } catch (error) {
    console.error('[Auth] JWT or API key authentication error:', error);
    return res.status(500).json({ 
      error: "Internal server error during authentication.",
      code: "AUTH_ERROR"
    });
  }
}



