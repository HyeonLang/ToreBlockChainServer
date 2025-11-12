import { promises as fs } from "fs";
import path from "path";
import {
  Contract,
  EventLog,
  Interface,
  JsonFragment,
  LogDescription,
} from "ethers";
import { Queue } from "bullmq";
import { getBullMQConnection } from "../../../config/redis.config";

const DATA_DIR = path.resolve(__dirname, "../../../../data");
const LAST_PROCESSED_BLOCK_PATH = path.join(DATA_DIR, "lastProcessedBlock.json");

/**
 * 이벤트 인자의 데이터 타입을 직렬화 가능한 값으로 변환합니다.
 * BigInt, 배열, 중첩 객체를 안전하게 문자열 또는 객체로 변환합니다.
 */
export const normalizeValue = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([key]) => Number.isNaN(Number(key)),
    );

    if (entries.length > 0) {
      const normalized: Record<string, unknown> = {};
      entries.forEach(([key, val]) => {
        normalized[key] = normalizeValue(val);
      });
      return normalized;
    }
  }

  return value;
};

/**
 * 블록 번호를 보관할 데이터 디렉터리를 준비합니다.
 */
const ensureDataDirectory = async (): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

/**
 * 마지막으로 처리한 블록 번호를 로컬 파일에서 읽어옵니다.
 */
export const readLastProcessedBlock = async (): Promise<number> => {
  try {
    const buffer = await fs.readFile(LAST_PROCESSED_BLOCK_PATH, "utf8");
    const parsed = JSON.parse(buffer) as { lastBlock?: number | string };
    const block = Number(parsed?.lastBlock ?? 0);
    if (Number.isFinite(block) && block >= 0) {
      return Math.floor(block);
    }
    return 0;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return 0;
    }
    console.error("[BaseListener] 마지막 처리 블록 읽기 실패:", error);
    return 0;
  }
};

/**
 * 최신으로 처리한 블록 번호를 파일에 저장합니다.
 */
export const writeLastProcessedBlock = async (blockNumber: number): Promise<void> => {
  if (!Number.isFinite(blockNumber) || blockNumber < 0) {
    return;
  }

  await ensureDataDirectory();
  const payload = JSON.stringify({ lastBlock: Math.floor(blockNumber) }, null, 2);
  await fs.writeFile(LAST_PROCESSED_BLOCK_PATH, payload, "utf8");
};

/**
 * BullMQ 큐에 전달할 페이로드를 구성합니다.
 */
export const buildPayload = (
  parsed: LogDescription,
  eventLog: EventLog,
  contractName: string,
): Record<string, unknown> => {
  const parsedArgs: Record<string, unknown> = {};

  parsed.fragment.inputs.forEach((input, index) => {
    const key = input.name && input.name.length > 0 ? input.name : `arg${index}`;
    parsedArgs[key] = normalizeValue(parsed.args[index]);
  });

  return {
    ...parsedArgs,
    blockNumber: eventLog.blockNumber,
    transactionHash: eventLog.transactionHash,
    logIndex: eventLog.index,
    removed: false,
    contract: contractName,
  };
};

/**
 * ABI 아티팩트에서 ABI를 추출합니다.
 */
export const artifactToAbi = (artifact: { abi: JsonFragment[] }): JsonFragment[] => {
  if (!artifact?.abi) {
    throw new Error("ABI가 포함되지 않은 아티팩트입니다.");
  }
  return artifact.abi;
};

/**
 * 환경 변수를 안전하게 읽어옵니다.
 */
export const resolveEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되어 있지 않습니다.`);
  }
  return value;
};

/**
 * 이벤트 큐 인스턴스를 생성합니다.
 */
export const createEventQueue = (queueName: string) => {
  return new Queue<Record<string, unknown>>(queueName, {
    connection: getBullMQConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: 500,
      removeOnFail: 0,
    },
  });
};

/**
 * 문자열을 kebab-case로 변환합니다.
 */
export const toKebabCase = (input: string): string =>
  input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1-$2")
    .toLowerCase();

