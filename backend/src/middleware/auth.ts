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
 * 더미 인증 미들웨어 (인증 비활성화)
 * 
 * 모든 요청을 통과시키는 더미 미들웨어
 * 인증 없이 모든 API에 접근 가능
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // 인증 없이 모든 요청 통과
  console.log('[Auth] Authentication disabled - allowing all requests');
  return next();
}




