/**
 * 메인 애플리케이션 진입점
 * 
 * 실행 흐름:
 * 1. 환경 변수 로드 (.env 파일)
 * 2. Express 서버 초기화
 * 3. 미들웨어 설정 (JSON 파싱)
 * 4. 라우트 등록
 * 5. 서버 시작 (포트 3000 또는 환경변수 PORT)
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import nftRouter from "./routes/nft";
import v1Router from "./routes/v1";
import toreTokenRouter from "./routes/toreToken";
import exchangeRouter from "./routes/exchange";
import { errorHandler } from "./middleware/errorHandler";
import { apiKeyAuth } from "./middleware/auth";

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
 * ToreToken 관련 라우터 등록 (API 키 인증 적용)
 * /api/tore 경로로 들어오는 모든 요청에 API 키 인증 미들웨어 적용
 * 예: /api/tore/info, /api/tore/balance/:address, /api/tore/transfer
 */
app.use("/api/tore", apiKeyAuth, toreTokenRouter);

/**
 * ToreExchange 관련 라우터 등록 (API 키 인증 적용)
 * /api/exchange 경로로 들어오는 모든 요청에 API 키 인증 미들웨어 적용
 * 예: /api/exchange/create-trade, /api/exchange/buy-nft, /api/exchange/stats
 */
app.use("/api/exchange", apiKeyAuth, exchangeRouter);


/**
 * NFT 관련 라우터 등록 (API 키 인증 적용)
 * /api/nft 경로로 들어오는 모든 요청에 API 키 인증 미들웨어 적용
 * 예: /api/nft/mint, /api/nft/burn, /api/nft/address
 */
app.use("/api/blockchain/nft", apiKeyAuth, nftRouter);

/**
 * v1 API 라우터 등록 (API 키 인증 적용)
 * /v1 경로로 들어오는 모든 요청에 API 키 인증 미들웨어 적용
 * 예: /v1/nfts/mint, /v1/nfts/transfer
 */
app.use("/v1", apiKeyAuth, v1Router);

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


