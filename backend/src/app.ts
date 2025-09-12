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
import nftRouter from "./routes/nft";
import v1Router from "./routes/v1";
import authRouter from "./routes/auth";
import toreTokenRouter from "./routes/toreToken";
import exchangeRouter from "./routes/exchange";
import { errorHandler } from "./middleware/errorHandler";
import { jwtOrApiKeyAuth } from "./middleware/auth";

// 환경 변수 로드 (.env 파일에서 환경변수 읽기)
dotenv.config();

// Express 애플리케이션 인스턴스 생성
const app = express();

// JSON 요청 본문을 파싱하는 미들웨어 등록
// 클라이언트에서 보내는 JSON 데이터를 req.body로 접근 가능하게 함
app.use(express.json());

// 정적 파일 서빙 (HTML, CSS, JS 파일들)
// frontend/public 폴더의 파일들을 루트 경로에서 접근 가능하게 함
app.use(express.static("frontend/public"));

/**
 * 루트 경로 - 메인 페이지로 리다이렉트
 */
app.get("/", (_req, res) => {
  res.sendFile("index.html", { root: "frontend/public" });
});

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
 * 사용자 인증 라우터 등록
 * /api/auth 경로로 들어오는 모든 요청을 authRouter로 위임
 * 예: /api/auth/login, /api/auth/logout, /api/auth/refresh
 * 
 * 인증 라우터는 JWT 인증이 필요하지 않음 (로그인을 위한 라우터)
 */
app.use("/api/auth", authRouter);

/**
 * ToreToken 관련 라우터 등록 (JWT 또는 API 키 인증 적용)
 * /api/tore 경로로 들어오는 모든 요청에 인증 미들웨어 적용
 * 예: /api/tore/info, /api/tore/balance/:address, /api/tore/transfer
 * 
 * 인증 방식:
 * - JWT 토큰이 있으면 JWT 인증
 * - JWT 토큰이 없으면 API 키 인증
 * - 두 방식 중 하나라도 성공하면 통과
 */
app.use("/api/tore", jwtOrApiKeyAuth, toreTokenRouter);

/**
 * ToreExchange 관련 라우터 등록 (JWT 또는 API 키 인증 적용)
 * /api/exchange 경로로 들어오는 모든 요청에 인증 미들웨어 적용
 * 예: /api/exchange/create-trade, /api/exchange/buy-nft, /api/exchange/stats
 * 
 * 인증 방식:
 * - JWT 토큰이 있으면 JWT 인증
 * - JWT 토큰이 없으면 API 키 인증
 * - 두 방식 중 하나라도 성공하면 통과
 */
app.use("/api/exchange", jwtOrApiKeyAuth, exchangeRouter);

/**
 * NFT 관련 라우터 등록 (JWT 또는 API 키 인증 적용)
 * /api/nft 경로로 들어오는 모든 요청에 인증 미들웨어 적용
 * 예: /api/nft/mint, /api/nft/burn, /api/nft/address
 * 
 * 인증 방식:
 * - JWT 토큰이 있으면 JWT 인증
 * - JWT 토큰이 없으면 API 키 인증
 * - 두 방식 중 하나라도 성공하면 통과
 */
app.use("/api/nft", jwtOrApiKeyAuth, nftRouter);

/**
 * v1 API 라우터 등록 (JWT 또는 API 키 인증 적용)
 * /v1 경로로 들어오는 모든 요청에 인증 미들웨어 적용
 * 예: /v1/nfts/mint, /v1/nfts/transfer
 * 
 * 인증 방식:
 * - JWT 토큰이 있으면 JWT 인증
 * - JWT 토큰이 없으면 API 키 인증
 * - 두 방식 중 하나라도 성공하면 통과
 */
app.use("/v1", jwtOrApiKeyAuth, v1Router);

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


