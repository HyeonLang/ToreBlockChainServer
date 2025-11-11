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
import multiTokenRouter from "./routes/multiToken";
import { errorHandler } from "./middleware/errorHandler";
import { initializeEventListeners } from "./services/blockchainListener.service";
import { startBlockchainWorker } from "./services/blockchainWorker.service";

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
 * MultiToken 관련 라우터 등록 (인증 없음)
 * /api/multi-token 경로로 들어오는 모든 요청에 인증 없이 접근 가능
 * 예: /api/multi-token/create, /api/multi-token/mint, /api/multi-token/balance/:symbol/:address
 */
app.use("/api/multi-token", multiTokenRouter);

/**
 * NFT 관련 라우터 등록 (인증 없음)
 * /api/nft 경로로 들어오는 모든 요청에 인증 없이 접근 가능
 * 예: /api/nft/mint, /api/nft/burn, /api/nft/address
 */
app.use("/api/blockchain/nft", nftRouter);

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

/**
 * BullMQ 워커와 블록체인 이벤트 리스너를 동시에 초기화합니다.
 * 서버가 시작될 때 비동기로 호출하여 MQ 파이프라인을 구성합니다.
 */
const startBlockchainServices = async (): Promise<void> => {
  try {
    await startBlockchainWorker();
    await initializeEventListeners();
    console.log("[App] 블록체인 이벤트 리스너와 워커가 시작되었습니다.");
  } catch (error) {
    console.error("[App] 블록체인 서비스 초기화 실패:", error);
  }
};

void startBlockchainServices();


