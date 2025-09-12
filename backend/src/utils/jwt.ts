/**
 * JWT(JSON Web Token) 관련 유틸리티 함수들
 * 
 * 기능:
 * - JWT 토큰 생성 (access token, refresh token)
 * - JWT 토큰 검증
 * - 토큰에서 사용자 정보 추출
 * - 토큰 만료 시간 관리
 * 
 * 보안 특징:
 * - Access Token: 짧은 만료 시간 (15분)
 * - Refresh Token: 긴 만료 시간 (7일)
 * - 환경변수에서 비밀키 관리
 */

import jwt from 'jsonwebtoken';

// JWT 비밀키 (환경변수에서 가져오거나 기본값 사용)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// 토큰 만료 시간 설정
const ACCESS_TOKEN_EXPIRES_IN = '15m';  // 15분
const REFRESH_TOKEN_EXPIRES_IN = '7d';  // 7일

/**
 * 사용자 정보를 담은 JWT 페이로드 타입 정의
 */
export interface JWTPayload {
  userId: string;        // 사용자 고유 ID
  username: string;      // 사용자명
  email?: string;        // 이메일 (선택사항)
  role?: string;         // 사용자 역할 (admin, user 등)
  iat?: number;          // 토큰 발급 시간 (자동 설정)
  exp?: number;          // 토큰 만료 시간 (자동 설정)
}

/**
 * JWT 토큰 생성 결과 타입 정의
 */
export interface TokenPair {
  accessToken: string;   // 접근 토큰 (짧은 만료)
  refreshToken: string;  // 갱신 토큰 (긴 만료)
  expiresIn: number;     // 만료 시간 (초 단위)
}

/**
 * Access Token 생성
 * 
 * @param payload - JWT에 포함할 사용자 정보
 * @returns 생성된 Access Token 문자열
 * 
 * 사용 예시:
 * ```typescript
 * const token = generateAccessToken({
 *   userId: '123',
 *   username: 'john_doe',
 *   role: 'user'
 * });
 * ```
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    // JWT 토큰 생성
    const token = jwt.sign(
      payload,                    // 페이로드 (사용자 정보)
      JWT_SECRET,                // 비밀키
      { 
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,  // 만료 시간
        issuer: 'tore-blockchain-server',    // 발급자
        audience: 'tore-client'              // 대상자
      }
    );
    
    console.log(`[JWT] Access token generated for user: ${payload.username}`);
    return token;
  } catch (error) {
    console.error('[JWT] Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Refresh Token 생성
 * 
 * @param payload - JWT에 포함할 사용자 정보
 * @returns 생성된 Refresh Token 문자열
 * 
 * 사용 예시:
 * ```typescript
 * const refreshToken = generateRefreshToken({
 *   userId: '123',
 *   username: 'john_doe'
 * });
 * ```
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    // Refresh Token은 더 긴 만료 시간을 가짐
    const token = jwt.sign(
      payload,                    // 페이로드 (사용자 정보)
      JWT_REFRESH_SECRET,        // Refresh Token 전용 비밀키
      { 
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,  // 7일 만료
        issuer: 'tore-blockchain-server',     // 발급자
        audience: 'tore-client'               // 대상자
      }
    );
    
    console.log(`[JWT] Refresh token generated for user: ${payload.username}`);
    return token;
  } catch (error) {
    console.error('[JWT] Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Access Token과 Refresh Token 쌍 생성
 * 
 * @param payload - JWT에 포함할 사용자 정보
 * @returns 토큰 쌍과 만료 시간 정보
 * 
 * 사용 예시:
 * ```typescript
 * const tokens = generateTokenPair({
 *   userId: '123',
 *   username: 'john_doe',
 *   role: 'user'
 * });
 * ```
 */
export function generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
  try {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    // Access Token의 만료 시간을 초 단위로 계산 (15분 = 900초)
    const expiresIn = 15 * 60; // 15분
    
    console.log(`[JWT] Token pair generated for user: ${payload.username}`);
    
    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  } catch (error) {
    console.error('[JWT] Error generating token pair:', error);
    throw new Error('Failed to generate token pair');
  }
}

/**
 * Access Token 검증
 * 
 * @param token - 검증할 Access Token
 * @returns 검증된 사용자 정보 또는 null
 * 
 * 사용 예시:
 * ```typescript
 * const user = verifyAccessToken(token);
 * if (user) {
 *   console.log('User:', user.username);
 * }
 * ```
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    // JWT 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    console.log(`[JWT] Access token verified for user: ${decoded.username}`);
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[JWT] Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('[JWT] Invalid access token');
    } else {
      console.error('[JWT] Error verifying access token:', error);
    }
    return null;
  }
}

/**
 * Refresh Token 검증
 * 
 * @param token - 검증할 Refresh Token
 * @returns 검증된 사용자 정보 또는 null
 * 
 * 사용 예시:
 * ```typescript
 * const user = verifyRefreshToken(refreshToken);
 * if (user) {
 *   const newTokens = generateTokenPair(user);
 * }
 * ```
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    // Refresh Token 검증 (다른 비밀키 사용)
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    
    console.log(`[JWT] Refresh token verified for user: ${decoded.username}`);
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[JWT] Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('[JWT] Invalid refresh token');
    } else {
      console.error('[JWT] Error verifying refresh token:', error);
    }
    return null;
  }
}

/**
 * 토큰에서 사용자 ID 추출
 * 
 * @param token - JWT 토큰
 * @returns 사용자 ID 또는 null
 * 
 * 사용 예시:
 * ```typescript
 * const userId = extractUserIdFromToken(token);
 * if (userId) {
 *   // 사용자 ID로 데이터베이스 조회
 * }
 * ```
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    // 토큰을 디코딩 (검증하지 않고 페이로드만 추출)
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.userId || null;
  } catch (error) {
    console.error('[JWT] Error extracting user ID from token:', error);
    return null;
  }
}

/**
 * 토큰 만료 시간 확인
 * 
 * @param token - JWT 토큰
 * @returns 만료까지 남은 시간 (초) 또는 null
 * 
 * 사용 예시:
 * ```typescript
 * const timeLeft = getTokenExpirationTime(token);
 * if (timeLeft && timeLeft < 300) { // 5분 미만
 *   // 토큰 갱신 필요
 * }
 * ```
 */
export function getTokenExpirationTime(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded?.exp) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - now;
    
    return timeLeft > 0 ? timeLeft : 0;
  } catch (error) {
    console.error('[JWT] Error getting token expiration time:', error);
    return null;
  }
}

/**
 * JWT 설정 정보 반환
 * 
 * @returns JWT 관련 설정 정보
 */
export function getJWTConfig() {
  return {
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'tore-blockchain-server',
    audience: 'tore-client'
  };
}
