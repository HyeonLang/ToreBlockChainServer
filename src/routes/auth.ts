/**
 * 사용자 인증 관련 라우터
 * 
 * 기능:
 * - 사용자 로그인/로그아웃
 * - JWT 토큰 갱신
 * - 사용자 프로필 관리
 * - 사용자 등록 (개발용)
 * 
 * 보안 특징:
 * - JWT 기반 인증
 * - 비밀번호 해싱 (bcrypt)
 * - 입력값 검증
 * - 에러 처리 및 로깅
 * 
 * API 엔드포인트:
 * - POST /api/auth/login - 로그인
 * - POST /api/auth/logout - 로그아웃 (인증 필요)
 * - POST /api/auth/refresh - 토큰 갱신
 * - GET /api/auth/profile - 프로필 조회 (인증 필요)
 * - POST /api/auth/register - 사용자 등록 (개발용)
 */

import { Router } from 'express';
import { 
  loginController, 
  logoutController, 
  refreshTokenController, 
  getProfileController,
  registerController 
} from '../controllers/authController';
import { authenticateJWT } from '../middleware/jwtAuth';

// Express 라우터 인스턴스 생성
const router = Router();

/**
 * POST /api/auth/login
 * 사용자 로그인 엔드포인트
 * 
 * 요청 본문:
 * ```json
 * {
 *   "username": "admin",        // 사용자명 (이메일 또는 사용자명)
 *   "email": "admin@tore.com",  // 이메일 (사용자명 또는 이메일)
 *   "password": "password"      // 비밀번호
 * }
 * ```
 * 
 * 응답 (성공):
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
 *     "role": "admin",
 *     "lastLoginAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 * 
 * 응답 (실패):
 * ```json
 * {
 *   "error": "Invalid credentials.",
 *   "code": "INVALID_CREDENTIALS"
 * }
 * ```
 * 
 * 실행 흐름:
 * 1. 사용자명/이메일과 비밀번호 검증
 * 2. 사용자 존재 여부 확인
 * 3. 비밀번호 검증 (bcrypt)
 * 4. JWT 토큰 쌍 생성
 * 5. 로그인 시간 업데이트
 * 6. 토큰과 사용자 정보 반환
 */
router.post('/login', loginController);

/**
 * POST /api/auth/logout
 * 사용자 로그아웃 엔드포인트 (JWT 인증 필요)
 * 
 * 요청 헤더:
 * ```
 * Authorization: Bearer <access_token>
 * ```
 * 
 * 응답 (성공):
 * ```json
 * {
 *   "success": true,
 *   "message": "Logout successful."
 * }
 * ```
 * 
 * 실행 흐름:
 * 1. JWT 토큰에서 사용자 정보 추출
 * 2. 로그아웃 시간 기록
 * 3. 성공 응답 반환
 * 
 * 주의사항:
 * - JWT는 무상태이므로 서버에서 즉시 무효화할 수 없음
 * - 실제 환경에서는 토큰 블랙리스트 관리 필요
 */
router.post('/logout', authenticateJWT, logoutController);

/**
 * POST /api/auth/refresh
 * JWT 토큰 갱신 엔드포인트
 * 
 * 요청 본문:
 * ```json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 * 
 * 응답 (성공):
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
 * 
 * 실행 흐름:
 * 1. Refresh Token 검증
 * 2. 사용자 정보 확인
 * 3. 새로운 토큰 쌍 생성
 * 4. 새로운 토큰 반환
 * 
 * 사용 시나리오:
 * - Access Token이 만료되었을 때
 * - 새로운 세션을 시작할 때
 * - 보안을 위해 정기적으로 토큰 갱신
 */
router.post('/refresh', refreshTokenController);

/**
 * GET /api/auth/profile
 * 사용자 프로필 조회 엔드포인트 (JWT 인증 필요)
 * 
 * 요청 헤더:
 * ```
 * Authorization: Bearer <access_token>
 * ```
 * 
 * 응답 (성공):
 * ```json
 * {
 *   "success": true,
 *   "user": {
 *     "id": "1",
 *     "username": "admin",
 *     "email": "admin@tore.com",
 *     "role": "admin",
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "lastLoginAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 * 
 * 실행 흐름:
 * 1. JWT 토큰에서 사용자 정보 추출
 * 2. 사용자 정보 조회
 * 3. 비밀번호 제외한 정보 반환
 * 
 * 사용 시나리오:
 * - 현재 로그인한 사용자 정보 확인
 * - 프로필 페이지 데이터 로드
 * - 권한 확인
 */
router.get('/profile', authenticateJWT, getProfileController);

/**
 * POST /api/auth/register
 * 사용자 등록 엔드포인트 (개발용)
 * 
 * 요청 본문:
 * ```json
 * {
 *   "username": "newuser",
 *   "email": "newuser@tore.com",
 *   "password": "password123",
 *   "role": "user"
 * }
 * ```
 * 
 * 응답 (성공):
 * ```json
 * {
 *   "success": true,
 *   "message": "User registered successfully.",
 *   "user": {
 *     "id": "3",
 *     "username": "newuser",
 *     "email": "newuser@tore.com",
 *     "role": "user",
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 * 
 * 실행 흐름:
 * 1. 입력값 검증 (필수 필드, 중복 확인)
 * 2. 비밀번호 해싱 (bcrypt)
 * 3. 새 사용자 생성
 * 4. 성공 응답 반환
 * 
 * 주의사항:
 * - 실제 환경에서는 이메일 인증, 비밀번호 정책 등 필요
 * - 관리자 권한으로만 등록 가능하도록 제한 고려
 * - 비밀번호는 해싱되어 저장됨
 */
router.post('/register', registerController);

/**
 * GET /api/auth/verify
 * JWT 토큰 검증 엔드포인트 (JWT 인증 필요)
 * 
 * 요청 헤더:
 * ```
 * Authorization: Bearer <access_token>
 * ```
 * 
 * 응답 (성공):
 * ```json
 * {
 *   "success": true,
 *   "valid": true,
 *   "user": {
 *     "id": "1",
 *     "username": "admin",
 *     "email": "admin@tore.com",
 *     "role": "admin"
 *   }
 * }
 * ```
 * 
 * 실행 흐름:
 * 1. JWT 토큰 검증
 * 2. 토큰 유효성 확인
 * 3. 사용자 정보 반환
 * 
 * 사용 시나리오:
 * - 클라이언트에서 토큰 유효성 확인
 * - 페이지 새로고침 시 인증 상태 확인
 * - API 호출 전 토큰 검증
 */
router.get('/verify', authenticateJWT, (req, res) => {
  // authenticateJWT 미들웨어에서 이미 토큰 검증 완료
  // req.user에 사용자 정보가 주입됨
  
  res.json({
    success: true,
    valid: true,
    user: {
      id: req.user?.userId,
      username: req.user?.username,
      email: req.user?.email,
      role: req.user?.role
    }
  });
});

// 라우터 export
export default router;
