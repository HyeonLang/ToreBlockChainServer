import axios from "axios";
import { config as loadEnv } from "dotenv";
import { Job, Worker } from "bullmq";

import { ensureRedisConnected, getBullMQConnection } from "../../config/redis.config";
import {
  MARKETPLACE_QUEUE_NAME,
  NFT_VAULT_QUEUE_NAME,
  toKebabCase,
} from "./index.service";

loadEnv();

let marketplaceWorker: Worker<Record<string, unknown>> | null = null;
let nftVaultWorker: Worker<Record<string, unknown>> | null = null;
let mainServerApiUrl: string | null = null;

const resolveEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되어 있지 않습니다.`);
  }
  return value;
};

/**
 * BullMQ 워커가 수행할 실제 API 호출 로직입니다.
 * 
 * 이 함수는 다음 상황에서 실행됩니다:
 * - MarketplaceVault 이벤트 (NFTListed, NFTSold, NFTReclaimed)가 큐에 추가되었을 때
 * - NftVault 이벤트 (NftLocked, NftUnlocked)가 큐에 추가되었을 때
 * 
 * 실행 흐름:
 * 1. marketplaceVault.listener.ts 또는 nftVault.listener.ts의 contract.on() 콜백에서 queue.add() 호출
 * 2. BullMQ 워커가 큐에서 작업을 가져옴
 * 3. 이 함수(sendEventToMainServer)가 실행되어 메인 서버로 이벤트 전송
 * 
 * 큐 작업 실패 시 throw하여 BullMQ 재시도를 활용합니다.
 */
const sendEventToMainServer = async (job: Job<Record<string, unknown>>) => {
  if (!mainServerApiUrl) {
    mainServerApiUrl = resolveEnv("MAIN_SERVER_API_URL").replace(/\/+$/, "");
  }

  const endpoint = `${mainServerApiUrl}/api/events/${toKebabCase(job.name)}`;

  try {
    // 이벤트의 모든 파라미터가 job.data에 포함되어 있음
    // buildPayload() 함수가 이벤트의 모든 파라미터를 동적으로 추출하여 포함시킴
    await axios.post(endpoint, job.data);
    console.log("[BlockchainWorker] 이벤트 전송 성공", {
      jobId: job.id,
      eventName: job.name,
      endpoint,
      payload: job.data, // 전송되는 모든 파라미터 확인용
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("[BlockchainWorker] 이벤트 전송 실패 (AxiosError)", {
        jobId: job.id,
        eventName: job.name,
        status: error.response?.status,
        data: error.response?.data ?? error.message,
      });
    } else {
      console.error("[BlockchainWorker] 이벤트 전송 실패", {
        jobId: job.id,
        eventName: job.name,
        error,
      });
    }
    throw error;
  }
};

const createWorker = (queueName: string, workerName: string) => {
  return new Worker<Record<string, unknown>>(
    queueName,
    /**
     * 워커가 큐에서 작업을 가져왔을 때 실행되는 핸들러 함수
     * 
     * 이 함수는 다음 상황에서 실행됩니다:
     * - MarketplaceVault 이벤트가 marketplace-events 큐에 추가되었을 때
     * - NftVault 이벤트가 nft-vault-events 큐에 추가되었을 때
     * 
     * 실행 순서:
     * 1. marketplaceVault.listener.ts 또는 nftVault.listener.ts의 contract.on() 콜백 실행
     * 2. queue.add()로 큐에 작업 추가
     * 3. 이 함수가 실행되어 sendEventToMainServer() 호출
     */
    async (job: Job<Record<string, unknown>>) => {
      await sendEventToMainServer(job);
    },
    {
      connection: getBullMQConnection(),
      concurrency: Number(process.env.BLOCKCHAIN_EVENT_WORKER_CONCURRENCY ?? 5),
    },
  );
};

/**
 * 두 개의 BullMQ 워커를 시작합니다.
 * 
 * - marketplaceWorker: marketplace-events 큐를 처리
 *   → NFTListed, NFTSold, NFTReclaimed 이벤트 처리
 * 
 * - nftVaultWorker: nft-vault-events 큐를 처리
 *   → NftLocked, NftUnlocked 이벤트 처리
 * 
 * 각 워커는 큐에서 이벤트를 가져와 sendEventToMainServer()를 실행합니다.
 */
export const startBlockchainWorker = async (): Promise<{
  marketplaceWorker: Worker<Record<string, unknown>>;
  nftVaultWorker: Worker<Record<string, unknown>>;
}> => {
  if (marketplaceWorker && nftVaultWorker) {
    return { marketplaceWorker, nftVaultWorker };
  }

  await ensureRedisConnected();

  // MarketplaceVault 이벤트를 처리하는 워커
  // NFTListed, NFTSold, NFTReclaimed 이벤트 발생 시 실행됨
  marketplaceWorker = createWorker(MARKETPLACE_QUEUE_NAME, "MarketplaceWorker");
  
  // NftVault 이벤트를 처리하는 워커
  // NftLocked, NftUnlocked 이벤트 발생 시 실행됨
  nftVaultWorker = createWorker(NFT_VAULT_QUEUE_NAME, "NftVaultWorker");

  // 이벤트 핸들러 등록
  [marketplaceWorker, nftVaultWorker].forEach((worker) => {
    worker.on("completed", (job: Job<Record<string, unknown>>) => {
      console.log("[BlockchainWorker] 작업 완료", {
        jobId: job.id,
        eventName: job.name,
      });
    });

    worker.on("failed", (job: Job<Record<string, unknown>> | undefined, error: Error) => {
      console.error("[BlockchainWorker] 작업 실패", {
        jobId: job?.id,
        eventName: job?.name,
        attemptsMade: job?.attemptsMade,
        error: error?.message,
      });
    });

    worker.on("error", (error: Error) => {
      console.error("[BlockchainWorker] 워커 오류", error);
    });
  });

  console.log("[BlockchainWorker] 워커들이 시작되었습니다.");

  return { marketplaceWorker, nftVaultWorker };
};

