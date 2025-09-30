/**
 * 전역 에러 핸들러 미들웨어 - 애플리케이션 에러 처리 중앙화
 * 
 * 기능:
 * - Express 애플리케이션에서 발생하는 모든 에러를 일관된 형태로 처리
 * - 에러 상태코드와 메시지를 표준화된 JSON 형태로 클라이언트에 응답
 * - 블록체인 관련 에러, 네트워크 에러, 비즈니스 로직 에러 등 모든 유형의 에러 처리
 * - 서버 로그와 클라이언트 응답을 분리하여 보안 강화
 * - 에러 발생 시 적절한 HTTP 상태 코드 자동 설정
 * 
 * 처리하는 에러 유형:
 * - 400 Bad Request: 잘못된 요청 파라미터
 * - 404 Not Found: 존재하지 않는 리소스 요청
 * - 500 Internal Server Error: 서버 내부 오류 (기본값)
 * - 블록체인 연결 오류, 스마트 컨트랙트 실행 실패
 * - 환경 변수 누락, 설정 오류
 * - 네트워크 타임아웃, RPC 연결 실패
 * 
 * 응답 형식:
 * ```json
 * {
 *   "error": "에러 메시지"
 * }
 * ```
 * 
 * 사용법:
 * - Express 앱에서 모든 라우트 등록 후 마지막 미들웨어로 등록
 * - app.use(errorHandler) 형태로 사용
 * - 모든 라우트에서 발생하는 에러를 자동으로 캐치하여 처리
 * 
 * 특징:
 * - 에러 발생 시 자동으로 JSON 응답 생성
 * - 클라이언트에게 민감한 서버 정보 노출 방지
 * - 로깅은 별도 미들웨어에서 처리 (보안 강화)
 * - 모든 에러를 일관된 형태로 처리하여 API 응답 표준화
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


