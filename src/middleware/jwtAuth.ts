/**
 * JWT 인증 미들웨어
 * 
 * 기능:
 * - JWT 토큰 검증 및 사용자 인증
 * - 보호된 라우트에 대한 접근 제어
 * - 사용자 정보를 req.user에 주입
 * - 토큰 만료 및 무효 토큰 처리
 * 
 * 사용법:
 * - 보호된 라우트에 적용: app.use('/api/protected', authenticateJWT)
 * - 개별 라우트에 적용: router.get('/data', authenticateJWT, controller)
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';

/**
 * Express Request 객체에 사용자 정보를 추가하기 위한 타입 확장
 * 
 * @interface AuthenticatedRequest
 * @extends Request
 * @property {JWTPayload} user - JWT에서 추출한 사용자 정보
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * JWT 토큰 인증 미들웨어
 * 
 * 실행 흐름:
 * 1. Authorization 헤더에서 Bearer 토큰 추출
 * 2. 토큰 존재 여부 확인
 * 3. JWT 토큰 검증
 * 4. 사용자 정보를 req.user에 주입
 * 5. 다음 미들웨어로 진행
 * 
 * @param req - Express Request 객체 (AuthenticatedRequest로 확장)
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 * 
 * @throws 401 - 토큰이 없거나 유효하지 않은 경우
 * @throws 403 - 토큰이 만료된 경우
 * 
 * 사용 예시:
 * ```typescript
 * app.get('/api/protected', authenticateJWT, (req: AuthenticatedRequest, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 */
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Authorization 헤더에서 Bearer 토큰 추출
    // 형식: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('[JWT Auth] No authorization header provided');
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Bearer 토큰 형식 확인 및 토큰 추출
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('[JWT Auth] Invalid authorization header format');
      return res.status(401).json({ 
        error: 'Invalid token format. Use "Bearer <token>".',
        code: 'INVALID_FORMAT'
      });
    }

    const token = parts[1];
    
    if (!token) {
      console.log('[JWT Auth] No token provided after Bearer');
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // JWT 토큰 검증
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      console.log('[JWT Auth] Token verification failed');
      return res.status(401).json({ 
        error: 'Invalid or expired token.',
        code: 'INVALID_TOKEN'
      });
    }

    // 사용자 정보를 request 객체에 주입
    req.user = decoded;
    
    console.log(`[JWT Auth] User authenticated: ${decoded.username} (${decoded.userId})`);
    
    // 다음 미들웨어로 진행
    next();
    
  } catch (error) {
    console.error('[JWT Auth] Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * 선택적 JWT 인증 미들웨어
 * 
 * 토큰이 있으면 검증하고, 없으면 그냥 통과
 * 사용자 정보가 있으면 req.user에 주입
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 * 
 * 사용 예시:
 * ```typescript
 * app.get('/api/public', optionalJWT, (req: AuthenticatedRequest, res) => {
 *   if (req.user) {
 *     res.json({ message: 'Hello authenticated user', user: req.user });
 *   } else {
 *     res.json({ message: 'Hello anonymous user' });
 *   }
 * });
 * ```
 */
export function optionalJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    // Authorization 헤더가 없으면 그냥 통과
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    if (!token) {
      return next();
    }

    // 토큰 검증 시도
    const decoded = verifyAccessToken(token);
    
    if (decoded) {
      req.user = decoded;
      console.log(`[JWT Auth] Optional authentication successful: ${decoded.username}`);
    } else {
      console.log('[JWT Auth] Optional authentication failed, continuing without user');
    }
    
    next();
    
  } catch (error) {
    console.error('[JWT Auth] Optional authentication error:', error);
    // 에러가 발생해도 다음 미들웨어로 진행 (선택적이므로)
    next();
  }
}

/**
 * 역할 기반 접근 제어 미들웨어
 * 
 * 특정 역할을 가진 사용자만 접근 허용
 * 
 * @param allowedRoles - 허용된 역할 배열
 * @returns 미들웨어 함수
 * 
 * 사용 예시:
 * ```typescript
 * app.get('/api/admin', authenticateJWT, requireRole(['admin']), adminController);
 * app.get('/api/moderator', authenticateJWT, requireRole(['admin', 'moderator']), moderatorController);
 * ```
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // 먼저 JWT 인증이 필요 (이 미들웨어는 authenticateJWT 다음에 사용)
    if (!req.user) {
      console.log('[JWT Auth] Role check failed: No authenticated user');
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`[JWT Auth] Access denied: User role '${userRole}' not in allowed roles [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    console.log(`[JWT Auth] Role check passed: User '${req.user.username}' has required role '${userRole}'`);
    next();
  };
}

/**
 * 사용자 ID 기반 접근 제어 미들웨어
 * 
 * 특정 사용자만 자신의 리소스에 접근 허용
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 * 
 * 사용 예시:
 * ```typescript
 * app.get('/api/users/:userId/profile', authenticateJWT, requireOwnership, getUserProfile);
 * ```
 */
export function requireOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    console.log('[JWT Auth] Ownership check failed: No authenticated user');
    return res.status(401).json({ 
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  // URL 파라미터에서 사용자 ID 추출
  const requestedUserId = req.params.userId;
  const authenticatedUserId = req.user.userId;

  if (requestedUserId !== authenticatedUserId) {
    console.log(`[JWT Auth] Ownership check failed: User '${authenticatedUserId}' cannot access resource of user '${requestedUserId}'`);
    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.',
      code: 'OWNERSHIP_REQUIRED'
    });
  }

  console.log(`[JWT Auth] Ownership check passed: User '${authenticatedUserId}' accessing own resource`);
  next();
}

/**
 * JWT 토큰 갱신 미들웨어
 * 
 * Refresh Token을 사용하여 새로운 Access Token 발급
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @param next - 다음 미들웨어 함수
 * 
 * 사용 예시:
 * ```typescript
 * app.post('/api/auth/refresh', refreshToken);
 * ```
 */
export function refreshToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token is required.',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Refresh Token 검증
    const { verifyRefreshToken, generateTokenPair } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // 새로운 토큰 쌍 생성
    const newTokens = generateTokenPair({
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    });

    console.log(`[JWT Auth] Token refreshed for user: ${decoded.username}`);
    
    res.json({
      success: true,
      ...newTokens,
      user: {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      }
    });
    
  } catch (error) {
    console.error('[JWT Auth] Token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal server error during token refresh.',
      code: 'REFRESH_ERROR'
    });
  }
}
