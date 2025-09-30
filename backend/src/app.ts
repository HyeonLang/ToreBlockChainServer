/**
 * ToreBlockChainServer - 메인 애플리케이션 진입점
 * 
 * 기능:
 * - Express.js 기반 REST API 서버
 * - MultiTokenFactory를 통한 ERC-20 토큰 발행 및 관리
 * - 블록체인 네트워크와의 연결 및 상호작용
 * - 환경 변수 기반 설정 관리
 * - 전역 에러 핸들링 및 로깅
 * 
 * 실행 흐름:
 * 1. 환경 변수 로드 (.env 파일에서 블록체인 설정)
 * 2. Express 서버 초기화 및 미들웨어 설정
 * 3. JSON 파싱 미들웨어 등록
 * 4. MultiToken API 라우트 등록
 * 5. 전역 에러 핸들러 등록
 * 6. 서버 시작 (포트 3000 또는 환경변수 PORT)
 * 
 * 제공 API:
 * - GET /health - 서버 상태 확인
 * - /api/multi-token/* - ERC-20 토큰 발행 및 관리 API
 * 
 * 주의사항:
 * - NFT 관련 기능은 별도의 nftblockchainserver에서 처리
 * - 단일 ToreToken 시스템은 레거시로 분류, MultiTokenFactory 사용 권장
 * - 모든 API는 인증 없이 접근 가능 (내부 네트워크용)
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multiTokenRouter from "./routes/multiToken";
import { errorHandler } from "./middleware/errorHandler";

// 환경 변수 로드 (.env 파일에서 환경변수 읽기)
// 현재 작업 디렉토리가 backend/src이므로 프로젝트 루트로 상대 경로 설정
const envPath = path.resolve(process.cwd(), '../../.env');
console.log('[App] .env 파일 경로 시도:', envPath);

// 파일 존재 여부 확인
try {
  const exists = fs.existsSync(envPath);
  console.log('[App] .env 파일 존재 여부:', exists);
  if (exists) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('[App] .env 파일 내용 미리보기:', content.substring(0, 100));
  }
} catch (err) {
  console.error('[App] .env 파일 확인 오류:', err);
}

dotenv.config({ path: envPath });
dotenv.config(); // 기본 경로도 시도

console.log('[App] 환경변수 로딩 확인:', {
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS ? '설정됨' : '설정안됨',
  PRIVATE_KEY: process.env.PRIVATE_KEY ? '설정됨' : '설정안됨',
  현재_디렉토리: process.cwd()
});

// Express 애플리케이션 인스턴스 생성
const app = express();

// JSON 요청 본문을 파싱하는 미들웨어 등록
// 클라이언트에서 보내는 JSON 데이터를 req.body로 접근 가능하게 함
app.use(express.json());


/**
 * 헬스 체크 엔드포인트
 * 서버가 정상적으로 실행 중인지 확인하는 용도
 * 
 * @param _req - Express Request 객체 (사용하지 않으므로 언더스코어로 표시)
 * @param res - Express Response 객체
 * @returns JSON 형태로 { ok: true } 반환
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});


/**
 * MultiToken 관련 라우터 등록 (ERC20 토큰 발행 기능)
 * /api/multi-token 경로로 들어오는 모든 요청에 접근 가능
 * 제공 기능: 토큰 생성, 민팅, 소각, 잔액 조회 등
 * 예: /api/multi-token/create, /api/multi-token/mint, /api/multi-token/balance/:symbol/:address
 */
app.use("/api/multi-token", multiTokenRouter);

// 전역 에러 핸들러 (항상 라우터 다음에 위치)
app.use(errorHandler);

// 서버 포트 설정 (환경변수 PORT가 없으면 3000 사용)
const port = Number(process.env.PORT || 3000);

// 테스트 환경이 아닐 때만 서버 시작
// 테스트 시에는 서버를 시작하지 않고 app 인스턴스만 export
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

// 테스트를 위해 app 인스턴스 export
export default app;


