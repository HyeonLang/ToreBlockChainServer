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
 * - 단독으로 사용하여 API 보안 제공
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




