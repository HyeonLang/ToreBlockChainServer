/**
 * 사용자 인증 관련 컨트롤러
 * 
 * 기능:
 * - 사용자 로그인 (JWT 토큰 발급)
 * - 사용자 로그아웃 (토큰 무효화)
 * - 토큰 갱신 (Refresh Token 사용)
 * - 사용자 프로필 조회
 * - 비밀번호 해싱 및 검증
 * 
 * 보안 특징:
 * - bcrypt를 사용한 비밀번호 해싱
 * - JWT Access Token (15분) + Refresh Token (7일)
 * - 입력값 검증 및 에러 처리
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateTokenPair, verifyRefreshToken, JWTPayload } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/jwtAuth';

// 임시 사용자 데이터베이스 (실제 프로젝트에서는 데이터베이스 사용)
// 실제 환경에서는 MongoDB, PostgreSQL 등의 데이터베이스를 사용해야 함
interface User {
  id: string;
  username: string;
  email: string;
  password: string; // 해싱된 비밀번호
  role: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// 메모리 기반 사용자 저장소 (개발용)
// 실제 환경에서는 데이터베이스에 저장
const users: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@tore.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    role: 'admin',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    username: 'user1',
    email: 'user1@tore.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    role: 'user',
    createdAt: new Date('2024-01-01')
  }
];

/**
 * 사용자 로그인 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 사용자명/이메일과 비밀번호 추출
 * 2. 입력값 검증 (필수 필드, 형식 확인)
 * 3. 사용자 존재 여부 확인
 * 4. 비밀번호 검증 (bcrypt.compare)
 * 5. JWT 토큰 쌍 생성 (Access + Refresh)
 * 6. 로그인 시간 업데이트
 * 7. 토큰과 사용자 정보 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns JWT 토큰과 사용자 정보
 * @throws 400 - 잘못된 요청 (필수 필드 누락, 형식 오류)
 * @throws 401 - 인증 실패 (사용자 없음, 비밀번호 오류)
 * @throws 500 - 서버 내부 오류
 * 
 * 요청 예시:
 * ```json
 * {
 *   "username": "admin",
 *   "password": "password"
 * }
 * ```
 * 
 * 응답 예시:
 * ```json
 * {
 *   "success": true,
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "expiresIn": 900,
 *   "user": {
 *     "id": "1",
 *     "username": "admin",
 *     "email": "admin@tore.com",
 *     "role": "admin"
 *   }
 * }
 * ```
 */
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[Auth] Login attempt:', req.body);
    
    // 요청 본문에서 로그인 정보 추출
    const { username, email, password } = req.body as { 
      username?: string; 
      email?: string; 
      password: string; 
    };
    
    // 필수 필드 검증
    if (!password) {
      console.log('[Auth] Login failed: Password is required');
      res.status(400).json({ 
        error: 'Password is required.',
        code: 'PASSWORD_REQUIRED'
      });
      return;
    }
    
    // 사용자명 또는 이메일 중 하나는 필수
    if (!username && !email) {
      console.log('[Auth] Login failed: Username or email is required');
      res.status(400).json({ 
        error: 'Username or email is required.',
        code: 'USERNAME_OR_EMAIL_REQUIRED'
      });
      return;
    }
    
    // 사용자 검색 (사용자명 또는 이메일로)
    let user: User | undefined;
    if (username) {
      user = users.find(u => u.username === username);
    } else if (email) {
      user = users.find(u => u.email === email);
    }
    
    if (!user) {
      console.log('[Auth] Login failed: User not found');
      res.status(401).json({ 
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }
    
    // 비밀번호 검증 (bcrypt.compare 사용)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('[Auth] Login failed: Invalid password');
      res.status(401).json({ 
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }
    
    // JWT 토큰 쌍 생성
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    // 로그인 시간 업데이트
    user.lastLoginAt = new Date();
    
    console.log(`[Auth] Login successful: ${user.username} (${user.id})`);
    
    // 성공 응답 (비밀번호 제외한 사용자 정보 반환)
    res.json({
      success: true,
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      }
    });
    
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login.',
      code: 'LOGIN_ERROR'
    });
  }
}

/**
 * 사용자 로그아웃 컨트롤러
 * 
 * 실행 흐름:
 * 1. JWT 토큰에서 사용자 정보 추출
 * 2. 로그아웃 시간 기록
 * 3. 성공 응답 반환
 * 
 * @param req - AuthenticatedRequest 객체 (JWT 인증 필요)
 * @param res - Express Response 객체
 * @returns 로그아웃 성공 메시지
 * 
 * 사용 예시:
 * ```typescript
 * app.post('/api/auth/logout', authenticateJWT, logoutController);
 * ```
 */
export async function logoutController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      console.log('[Auth] Logout failed: No authenticated user');
      res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }
    
    console.log(`[Auth] Logout successful: ${req.user.username} (${req.user.userId})`);
    
    // 실제 환경에서는 토큰을 블랙리스트에 추가하거나
    // 데이터베이스에서 사용자 상태를 업데이트
    
    res.json({
      success: true,
      message: 'Logout successful.'
    });
    
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error during logout.',
      code: 'LOGOUT_ERROR'
    });
  }
}

/**
 * 토큰 갱신 컨트롤러
 * 
 * 실행 흐름:
 * 1. 요청 본문에서 Refresh Token 추출
 * 2. Refresh Token 검증
 * 3. 새로운 Access Token과 Refresh Token 생성
 * 4. 새로운 토큰 쌍 반환
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns 새로운 JWT 토큰 쌍
 * 
 * 요청 예시:
 * ```json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 */
export async function refreshTokenController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[Auth] Token refresh attempt');
    
    const { refreshToken } = req.body as { refreshToken: string };
    
    if (!refreshToken) {
      console.log('[Auth] Refresh failed: No refresh token provided');
      res.status(400).json({ 
        error: 'Refresh token is required.',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
      return;
    }
    
    // Refresh Token 검증
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      console.log('[Auth] Refresh failed: Invalid refresh token');
      res.status(401).json({ 
        error: 'Invalid or expired refresh token.',
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }
    
    // 사용자 정보 확인
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      console.log('[Auth] Refresh failed: User not found');
      res.status(401).json({ 
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }
    
    // 새로운 토큰 쌍 생성
    const newTokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    console.log(`[Auth] Token refresh successful: ${user.username} (${user.id})`);
    
    res.json({
      success: true,
      ...newTokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal server error during token refresh.',
      code: 'REFRESH_ERROR'
    });
  }
}

/**
 * 사용자 프로필 조회 컨트롤러
 * 
 * 실행 흐름:
 * 1. JWT 토큰에서 사용자 정보 추출
 * 2. 사용자 정보 반환 (비밀번호 제외)
 * 
 * @param req - AuthenticatedRequest 객체 (JWT 인증 필요)
 * @param res - Express Response 객체
 * @returns 사용자 프로필 정보
 * 
 * 사용 예시:
 * ```typescript
 * app.get('/api/auth/profile', authenticateJWT, getProfileController);
 * ```
 */
export async function getProfileController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      console.log('[Auth] Profile fetch failed: No authenticated user');
      res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }
    
    // 사용자 정보 조회
    const user = users.find(u => u.id === req.user!.userId);
    
    if (!user) {
      console.log('[Auth] Profile fetch failed: User not found');
      res.status(404).json({ 
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }
    
    console.log(`[Auth] Profile fetched: ${user.username} (${user.id})`);
    
    // 비밀번호 제외한 사용자 정보 반환
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
    
  } catch (error) {
    console.error('[Auth] Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error during profile fetch.',
      code: 'PROFILE_ERROR'
    });
  }
}

/**
 * 사용자 등록 컨트롤러 (개발용)
 * 
 * 실제 환경에서는 이메일 인증, 비밀번호 정책 등이 필요
 * 
 * @param req - Express Request 객체
 * @param res - Express Response 객체
 * @returns 등록 성공 메시지
 */
export async function registerController(req: Request, res: Response): Promise<void> {
  try {
    console.log('[Auth] Registration attempt:', req.body);
    
    const { username, email, password, role = 'user' } = req.body as {
      username: string;
      email: string;
      password: string;
      role?: string;
    };
    
    // 필수 필드 검증
    if (!username || !email || !password) {
      console.log('[Auth] Registration failed: Missing required fields');
      res.status(400).json({ 
        error: 'Username, email, and password are required.',
        code: 'MISSING_FIELDS'
      });
      return;
    }
    
    // 사용자명 중복 확인
    if (users.find(u => u.username === username)) {
      console.log('[Auth] Registration failed: Username already exists');
      res.status(409).json({ 
        error: 'Username already exists.',
        code: 'USERNAME_EXISTS'
      });
      return;
    }
    
    // 이메일 중복 확인
    if (users.find(u => u.email === email)) {
      console.log('[Auth] Registration failed: Email already exists');
      res.status(409).json({ 
        error: 'Email already exists.',
        code: 'EMAIL_EXISTS'
      });
      return;
    }
    
    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 새 사용자 생성
    const newUser: User = {
      id: (users.length + 1).toString(),
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    console.log(`[Auth] Registration successful: ${username} (${newUser.id})`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
    
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error during registration.',
      code: 'REGISTRATION_ERROR'
    });
  }
}

/**
 * 비밀번호 해싱 유틸리티 함수
 * 
 * @param password - 원본 비밀번호
 * @returns 해싱된 비밀번호
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증 유틸리티 함수
 * 
 * @param password - 원본 비밀번호
 * @param hashedPassword - 해싱된 비밀번호
 * @returns 비밀번호 일치 여부
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
