import axios from "axios";
import { config as loadEnv } from "dotenv";
import { Job, Worker } from "bullmq";

import { ensureRedisConnected, getBullMQConnection } from "../config/redis.config";
import { EVENT_QUEUE_NAME, toKebabCase } from "./blockchainListener.service";

loadEnv();

let workerInstance: Worker<Record<string, unknown>> | null = null;
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
 * 큐 작업 실패 시 throw하여 BullMQ 재시도를 활용합니다.
 */
const sendEventToMainServer = async (job: Job<Record<string, unknown>>) => {
  if (!mainServerApiUrl) {
    mainServerApiUrl = resolveEnv("MAIN_SERVER_API_URL").replace(/\/+$/, "");
  }

  const endpoint = `${mainServerApiUrl}/api/events/${toKebabCase(job.name)}`;

  try {
    await axios.post(endpoint, job.data);
    console.log("[BlockchainWorker] 이벤트 전송 성공", {
      jobId: job.id,
      eventName: job.name,
      endpoint,
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

export const startBlockchainWorker = async (): Promise<Worker<Record<string, unknown>>> => {
  if (workerInstance) {
    return workerInstance;
  }

  await ensureRedisConnected();

  /**
   * BullMQ 워커를 생성하여 큐의 이벤트를 처리합니다.
   * concurrency는 환경 변수로 조정 가능하며, 기본값은 5입니다.
   */
  workerInstance = new Worker<Record<string, unknown>>(
    EVENT_QUEUE_NAME,
    async (job: Job<Record<string, unknown>>) => {
      await sendEventToMainServer(job);
    },
    {
      connection: getBullMQConnection(),
      concurrency: Number(process.env.BLOCKCHAIN_EVENT_WORKER_CONCURRENCY ?? 5),
    },
  );

  workerInstance.on("completed", (job: Job<Record<string, unknown>>) => {
    console.log("[BlockchainWorker] 작업 완료", {
      jobId: job.id,
      eventName: job.name,
    });
  });

  workerInstance.on(
    "failed",
    (job: Job<Record<string, unknown>> | undefined, error: Error) => {
    console.error("[BlockchainWorker] 작업 실패", {
      jobId: job?.id,
      eventName: job?.name,
      attemptsMade: job?.attemptsMade,
      error: error?.message,
    });
    },
  );

  workerInstance.on("error", (error: Error) => {
    console.error("[BlockchainWorker] 워커 오류", error);
  });

  console.log("[BlockchainWorker] 워커가 시작되었습니다.");

  return workerInstance;
};

