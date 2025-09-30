/**
 * 전역 에러 핸들러 미들웨어
 * 
 * 기능:
 * - 애플리케이션에서 발생하는 모든 에러를 일관된 형태로 처리
 * - 에러 상태코드와 메시지를 JSON 형태로 응답
 * 
 * 사용법:
 * - Express 앱에서 마지막 미들웨어로 등록
 * - app.use(errorHandler) 형태로 사용
 */

import { NextFunction, Request, Response } from "express";

/**
 * 전역 에러 처리 함수
 * 
 * 실행 흐름:
 * 1. 에러 객체에서 상태코드 추출 (기본값: 500)
 * 2. 에러 메시지 추출 (기본값: "Internal Server Error")
 * 3. JSON 형태로 에러 정보 응답
 * 
 * @param err - 발생한 에러 객체
 * @param _req - Express Request 객체 (사용하지 않음)
 * @param res - Express Response 객체
 * @param _next - Express NextFunction (사용하지 않음)
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // 에러 상태코드 추출 (기본값: 500 Internal Server Error)
  const status = err.status || 500;
  
  // 에러 메시지 추출 (기본값: "Internal Server Error")
  const message = err.message || "Internal Server Error";
  
  // JSON 형태로 에러 정보 응답
  res.status(status).json({ error: message });
}


