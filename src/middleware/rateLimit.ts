/**
 * 레이트 리미팅 미들웨어 (토큰 버킷 알고리즘)
 * 
 * 기능:
 * - 클라이언트별 요청 횟수 제한
 * - 토큰 버킷 알고리즘 사용 (부드러운 제한)
 * - IP 주소와 API 키 기반 구분
 * - 환경변수로 설정 가능
 * 
 * 알고리즘 설명:
 * - 각 클라이언트마다 토큰 버킷 할당
 * - 시간이 지날수록 토큰이 자동으로 충전됨
 * - 요청 시 토큰 1개 소모
 * - 토큰이 없으면 429 Too Many Requests 응답
 * 
 * 설정:
 * - RATE_LIMIT_WINDOW_MS: 시간 윈도우 (기본: 60000ms = 1분)
 * - RATE_LIMIT_MAX: 최대 토큰 수 (기본: 60개)
 * - 결과: 1분에 최대 60개 요청 허용
 */

import { Request, Response, NextFunction } from "express";

/**
 * 토큰 버킷 정보 타입 정의
 * 
 * @interface Bucket
 * @property {number} tokens - 현재 사용 가능한 토큰 수
 * @property {number} lastRefillMs - 마지막 토큰 충전 시간 (밀리초)
 */
type Bucket = { 
  tokens: number;        // 현재 사용 가능한 토큰 수
  lastRefillMs: number;  // 마지막 토큰 충전 시간 (밀리초)
};

/**
 * 클라이언트별 토큰 버킷 저장소
 * 
 * 키 형식: "IP주소:API키" 또는 "IP주소:anon"
 * 값: 해당 클라이언트의 토큰 버킷 정보
 */
const buckets = new Map<string, Bucket>();

/**
 * 레이트 리미팅 설정값
 * 
 * 환경변수에서 가져오거나 기본값 사용
 */
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);  // 1분
const MAX_TOKENS = Number(process.env.RATE_LIMIT_MAX || 60);           // 60개 토큰

/**
 * 레이트 리미팅 미들웨어 함수
 * 
 * 실행 흐름:
 * 1. 클라이언트 식별자 생성 (IP + API키)
 * 2. 해당 클라이언트의 토큰 버킷 조회/생성
 * 3. 경과 시간에 따른 토큰 충전 계산
 * 4. 토큰 사용 가능 여부 확인
 * 5. 토큰 소모 또는 429 에러 응답
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 * 
 * 사용 예시:
 * ```typescript
 * app.use('/api', rateLimit);
 * app.get('/api/data', rateLimit, dataController);
 * ```
 */
export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  try {
    // 클라이언트 식별자 생성
    // IP 주소와 API 키를 조합하여 고유 식별자 생성
    // API 키가 없으면 "anon"으로 표시
    const key = req.ip + ":" + (req.header("x-api-key") || "anon");
    
    // 현재 시간 (밀리초)
    const now = Date.now();
    
    // 토큰 충전 속도 계산 (밀리초당 토큰 수)
    // 예: 60개 토큰을 60000ms(1분)에 걸쳐 충전 = 1ms당 0.001개 토큰
    const refillRate = MAX_TOKENS / WINDOW_MS;

    // 해당 클라이언트의 토큰 버킷 조회
    let bucket = buckets.get(key);
    
    // 토큰 버킷이 없으면 새로 생성
    if (!bucket) {
      bucket = { 
        tokens: MAX_TOKENS,  // 처음에는 최대 토큰으로 시작
        lastRefillMs: now    // 현재 시간을 마지막 충전 시간으로 설정
      };
      buckets.set(key, bucket);
      console.log(`[Rate Limit] New bucket created for key: ${key}`);
    }

    // 마지막 충전 이후 경과 시간 계산
    const elapsed = now - bucket.lastRefillMs;
    
    // 경과 시간에 따른 토큰 충전
    // 경과 시간 * 충전 속도만큼 토큰 추가 (최대값 제한)
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsed * refillRate);
    bucket.lastRefillMs = now;

    // 토큰이 1개 미만이면 요청 거부
    if (bucket.tokens < 1) {
      // 다음 토큰 사용 가능까지의 시간 계산
      const retryMs = Math.ceil((1 - bucket.tokens) / refillRate);
      
      // Retry-After 헤더 설정 (초 단위)
      res.setHeader("Retry-After", Math.ceil(retryMs / 1000).toString());
      
      console.log(`[Rate Limit] Request blocked for key: ${key}, retry after: ${Math.ceil(retryMs / 1000)}s`);
      
      return res.status(429).json({ 
        error: "Too Many Requests",
        retryAfter: Math.ceil(retryMs / 1000),
        message: `Rate limit exceeded. Try again in ${Math.ceil(retryMs / 1000)} seconds.`
      });
    }

    // 토큰 1개 소모하고 다음 미들웨어로 진행
    bucket.tokens -= 1;
    
    console.log(`[Rate Limit] Request allowed for key: ${key}, remaining tokens: ${Math.floor(bucket.tokens)}`);
    
    return next();
    
  } catch (error) {
    console.error('[Rate Limit] Error in rate limiting middleware:', error);
    // 레이트 리미팅 에러가 발생해도 요청은 통과시킴
    return next();
  }
}

/**
 * 특정 클라이언트의 토큰 버킷 상태 조회
 * 
 * @param key - 클라이언트 식별자
 * @returns 토큰 버킷 정보 또는 null
 * 
 * 사용 예시:
 * ```typescript
 * const bucket = getBucketStatus("192.168.1.1:my-api-key");
 * console.log(`Remaining tokens: ${bucket?.tokens}`);
 * ```
 */
export function getBucketStatus(key: string): Bucket | null {
  return buckets.get(key) || null;
}

/**
 * 모든 토큰 버킷 초기화 (관리자용)
 * 
 * 사용 예시:
 * ```typescript
 * app.post('/admin/reset-rate-limits', (req, res) => {
 *   clearAllBuckets();
 *   res.json({ message: 'All rate limit buckets cleared' });
 * });
 * ```
 */
export function clearAllBuckets(): void {
  buckets.clear();
  console.log('[Rate Limit] All buckets cleared');
}

/**
 * 레이트 리미팅 설정 정보 반환
 * 
 * @returns 현재 레이트 리미팅 설정
 */
export function getRateLimitConfig() {
  return {
    windowMs: WINDOW_MS,
    maxTokens: MAX_TOKENS,
    refillRate: MAX_TOKENS / WINDOW_MS,
    activeBuckets: buckets.size
  };
}



