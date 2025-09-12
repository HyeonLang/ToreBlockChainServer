# NFT 블록체인 프로젝트 완전 가이드 - 8편: 보안 및 인증 시스템 설명

## 📚 목차
1. [보안 개요](#보안-개요)
2. [JWT 인증 시스템](#jwt-인증-시스템)
3. [API 키 인증](#api-키-인증)
4. [비밀번호 보안](#비밀번호-보안)
5. [레이트 리미팅](#레이트-리미팅)
6. [입력값 검증](#입력값-검증)
7. [보안 모범 사례](#보안-모범-사례)

---

## 🔒 보안 개요

### 보안의 중요성

**보안**은 블록체인 애플리케이션에서 가장 중요한 요소 중 하나입니다.

**보안 위험 요소:**
- **개인키 노출**: 지갑 자산 탈취 위험
- **API 키 유출**: 무단 API 사용 위험
- **비밀번호 해킹**: 계정 탈취 위험
- **DDoS 공격**: 서비스 중단 위험
- **입력값 조작**: 시스템 오류 위험

### 보안 계층

```
┌─────────────────┐
│   프론트엔드    │ ← 사용자 입력 검증
├─────────────────┤
│   백엔드 API    │ ← 인증, 권한, 레이트 리미팅
├─────────────────┤
│   블록체인      │ ← 스마트 컨트랙트 보안
└─────────────────┘
```

---

## 🎫 JWT 인증 시스템

### JWT란?

**JWT (JSON Web Token)**는 사용자 인증을 위한 토큰 기반 인증 시스템입니다.

**JWT의 특징:**
- **무상태**: 서버에 세션 정보 저장 불필요
- **자체 포함**: 토큰 자체에 사용자 정보 포함
- **서명 검증**: 토큰의 무결성 보장
- **만료 시간**: 보안을 위한 토큰 생명주기 관리

### JWT 구조

```
JWT = Header.Payload.Signature

Header: {
  "alg": "HS256",    // 해싱 알고리즘
  "typ": "JWT"       // 토큰 타입
}

Payload: {
  "userId": "1",           // 사용자 ID
  "username": "admin",     // 사용자명
  "email": "admin@tore.com", // 이메일
  "role": "admin",         // 역할
  "iat": 1640995200,      // 발급 시간
  "exp": 1640996100       // 만료 시간
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

### JWT 토큰 생성

```typescript
// utils/jwt.ts
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export function generateTokenPair(payload: JWTPayload) {
  // Access Token (15분)
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m'
  });
  
  // Refresh Token (7일)
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'
  });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 900  // 15분 (초 단위)
  };
}
```

### JWT 토큰 검증

```typescript
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

### JWT 미들웨어

```typescript
// middleware/jwtAuth.ts
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    
    // 사용자 정보를 요청 객체에 추가
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      });
    }
  }
}
```

---

## 🔑 API 키 인증

### API 키란?

**API 키**는 API 접근을 제어하기 위한 문자열입니다.

**API 키의 특징:**
- **간단함**: 복잡한 인증 과정 없음
- **고정성**: 만료 시간 없음
- **관리 용이**: 생성, 삭제가 쉬움
- **보안성**: 환경변수로 안전하게 관리

### API 키 인증 미들웨어

```typescript
// middleware/auth.ts
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
      return res.status(401).json({ 
        error: "API key required. Please provide x-api-key header.",
        code: "API_KEY_REQUIRED"
      });
    }

    // API 키 검증
    if (providedKey !== configuredKey) {
      return res.status(401).json({ 
        error: "Invalid API key.",
        code: "INVALID_API_KEY"
      });
    }

    return next();
    
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error during API key authentication.",
      code: "API_KEY_AUTH_ERROR"
    });
  }
}
```

### 하이브리드 인증

```typescript
export function jwtOrApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT 토큰이 있으면 JWT 인증 시도
      return authenticateJWT(req, res, next);
    } else {
      // JWT 토큰이 없으면 API 키 인증 시도
      return apiKeyAuth(req, res, next);
    }
    
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal server error during authentication.",
      code: "AUTH_ERROR"
    });
  }
}
```

---

## 🔐 비밀번호 보안

### bcrypt 해싱

**bcrypt**는 비밀번호를 안전하게 해싱하는 라이브러리입니다.

**bcrypt의 특징:**
- **솔트**: 각 비밀번호마다 고유한 솔트 생성
- **라운드**: 해싱 반복 횟수 (시간 복잡도 조절)
- **적응형**: 하드웨어 성능 향상에 따라 라운드 수 조절

### 비밀번호 해싱

```typescript
// controllers/authController.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;  // 솔트 라운드 (10 권장)
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

### 로그인 시 비밀번호 검증

```typescript
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    
    // 사용자 검색
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // 비밀번호 검증 (bcrypt.compare 사용)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // JWT 토큰 생성
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    res.json({
      success: true,
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error during login.',
      code: 'LOGIN_ERROR'
    });
  }
}
```

---

## 🚦 레이트 리미팅

### 레이트 리미팅이란?

**레이트 리미팅**은 API 사용량을 제한하여 서버를 보호하는 기법입니다.

**레이트 리미팅의 목적:**
- **DDoS 공격 방지**: 과도한 요청 차단
- **서버 보호**: 리소스 과부하 방지
- **공정한 사용**: 모든 사용자에게 동일한 기회 제공

### 토큰 버킷 알고리즘

```typescript
// middleware/rateLimit.ts
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  try {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1분
    const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 60; // 60 요청
    
    // 클라이언트 식별 (IP 주소 또는 API 키)
    const clientId = req.header('x-api-key') || req.ip;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Unable to identify client' });
    }
    
    const now = Date.now();
    let bucket = buckets.get(clientId);
    
    if (!bucket) {
      bucket = {
        tokens: maxRequests,
        lastRefill: now
      };
      buckets.set(clientId, bucket);
    }
    
    // 토큰 보충
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / windowMs) * maxRequests;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
    
    // 토큰 소비
    if (bucket.tokens > 0) {
      bucket.tokens--;
      next();
    } else {
      res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    next(); // 에러 시 제한 없이 통과
  }
}
```

### 레이트 리미팅 설정

```env
# .env 파일
RATE_LIMIT_WINDOW_MS=60000  # 1분 (밀리초)
RATE_LIMIT_MAX=60           # 최대 60 요청
```

---

## ✅ 입력값 검증

### 입력값 검증의 중요성

**입력값 검증**은 악의적인 입력을 차단하여 시스템을 보호합니다.

**검증해야 할 항목:**
- **주소 형식**: 이더리움 주소 형식 확인
- **URI 형식**: 메타데이터 URI 형식 확인
- **토큰 ID**: 숫자 형식 및 범위 확인
- **문자열 길이**: 최대 길이 제한

### 주소 형식 검증

```typescript
// 컨트롤러에서 주소 검증
export async function mintNftController(req: Request, res: Response) {
  try {
    const { to, tokenURI } = req.body;
    
    // 주소 형식 검증
    if (!to || typeof to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({ error: "Invalid 'to' address" });
    }
    
    // URI 형식 검증
    if (!tokenURI || typeof tokenURI !== "string" || tokenURI.length > 2048) {
      return res.status(400).json({ error: "Invalid 'tokenURI'" });
    }
    
    // URI 프로토콜 검증
    try {
      const u = new URL(tokenURI);
      if (!["http:", "https:", "ipfs:"].includes(u.protocol)) {
        return res.status(400).json({ error: "Unsupported tokenURI scheme" });
      }
    } catch {
      return res.status(400).json({ error: "Malformed tokenURI" });
    }
    
    // 비즈니스 로직 실행
    // ...
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 토큰 ID 검증

```typescript
export async function getNftController(req: Request, res: Response) {
  try {
    const { tokenId } = req.params;
    
    // 토큰 ID 검증
    if (!tokenId) {
      return res.status(400).json({ error: "Missing tokenId" });
    }
    
    const numeric = Number(tokenId);
    if (!Number.isInteger(numeric) || numeric < 0) {
      return res.status(400).json({ error: "Invalid tokenId" });
    }
    
    // 비즈니스 로직 실행
    // ...
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🛡 보안 모범 사례

### 1. 환경 변수 보안

```env
# .env 파일 보안
PRIVATE_KEY=0x...                    # 절대 공개하지 마세요!
API_KEY=your-secret-api-key          # 강력한 API 키 사용
JWT_ACCESS_SECRET=your-access-secret # 강력한 JWT 시크릿
JWT_REFRESH_SECRET=your-refresh-secret # 강력한 JWT 시크릿
```

**보안 원칙:**
- **강력한 비밀번호**: 최소 32자리, 랜덤 문자열
- **환경별 분리**: 개발, 스테이징, 프로덕션 환경 분리
- **접근 제한**: 필요한 사람만 접근 가능하도록 설정

### 2. HTTPS 사용

```typescript
// 프로덕션 환경에서 HTTPS 강제
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 3. CORS 설정

```typescript
import cors from 'cors';

// CORS 설정
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
```

### 4. 로깅 및 모니터링

```typescript
// 보안 이벤트 로깅
export function logSecurityEvent(event: string, details: any) {
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent,
    userId: details.userId,
    details: details
  });
}

// 인증 실패 로깅
export function logAuthFailure(req: Request, reason: string) {
  logSecurityEvent('AUTH_FAILURE', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    reason: reason,
    endpoint: req.path
  });
}
```

### 5. 에러 정보 노출 방지

```typescript
// 프로덕션 환경에서 상세 에러 정보 숨김
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[Error Handler]', err);
  
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  
  if (process.env.NODE_ENV === 'development') {
    message = err.message;
    code = err.name;
  }
  
  res.status(500).json({
    error: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

---

## 📋 다음 단계

이제 보안 및 인증 시스템을 이해했으니, 다음 가이드에서는 실행 흐름과 전체 동작 원리에 대해 자세히 알아보겠습니다.

**다음 가이드**: [실행 흐름 및 전체 동작 원리](./NFT_BLOCKCHAIN_PROJECT_GUIDE_9_실행흐름.md)

---

## 💡 핵심 정리

1. **JWT 토큰 시스템으로 사용자 인증을 관리합니다.**
2. **API 키 인증으로 간단한 접근 제어를 제공합니다.**
3. **bcrypt로 비밀번호를 안전하게 해싱합니다.**
4. **레이트 리미팅으로 서버를 보호합니다.**
5. **입력값 검증으로 악의적인 입력을 차단합니다.**
