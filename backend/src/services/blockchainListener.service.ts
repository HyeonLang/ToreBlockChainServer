import { config as loadEnv } from "dotenv";
import { promises as fs } from "fs";
import path from "path";
import {
  Contract,
  EventFragment,
  EventLog,
  Interface,
  JsonFragment,
  LogDescription,
  WebSocketProvider,
} from "ethers";
import { Queue } from "bullmq";

import MarketplaceVaultArtifact from "../../../blockchain/artifacts/blockchain/contracts/MarketplaceVault.sol/MarketplaceVault.json";
import NftVaultArtifact from "../../../blockchain/artifacts/blockchain/contracts/NftVault.sol/NftVault.json";
import { ensureRedisConnected, getBullMQConnection } from "../config/redis.config";

loadEnv();

type CleanupFn = () => Promise<void> | void;

interface InitializedResources {
  provider: WebSocketProvider;
  marketplaceVault: Contract;
  nftVault: Contract;
  cleanup: CleanupFn;
}

interface ContractContext {
  contract: Contract;
  contractName: string;
  iface: Interface;
}

const DATA_DIR = path.resolve(__dirname, "../../data");
const LAST_PROCESSED_BLOCK_PATH = path.join(DATA_DIR, "lastProcessedBlock.json");

export const EVENT_QUEUE_NAME = "blockchain-events";

export const toKebabCase = (input: string): string =>
  input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1-$2")
    .toLowerCase();

/**
 * 실시간/백필 이벤트를 메인 서버로 전달하기 전에 적재할 BullMQ 큐 인스턴스입니다.
 * 기본 재시도 전략과 정리 정책을 설정합니다.
 */
export const eventQueue = new Queue<Record<string, unknown>>(EVENT_QUEUE_NAME, {
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

let resources: InitializedResources | null = null;

const artifactToAbi = (artifact: { abi: JsonFragment[] }): JsonFragment[] => {
  if (!artifact?.abi) {
    throw new Error("ABI가 포함되지 않은 아티팩트입니다.");
  }
  return artifact.abi;
};

const resolveEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되어 있지 않습니다.`);
  }
  return value;
};

/**
 * 이벤트 인자의 데이터 타입을 직렬화 가능한 값으로 변환합니다.
 * BigInt, 배열, 중첩 객체를 안전하게 문자열 또는 객체로 변환합니다.
 */
const normalizeValue = (value: unknown): unknown => {
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
 * 파일이 없거나 파싱에 실패하면 0을 반환합니다.
 */
const readLastProcessedBlock = async (): Promise<number> => {
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
    console.error("[BlockchainListener] 마지막 처리 블록 읽기 실패:", error);
    return 0;
  }
};

/**
 * 최신으로 처리한 블록 번호를 파일에 저장합니다.
 * 음수나 숫자가 아닌 값은 무시합니다.
 */
const writeLastProcessedBlock = async (blockNumber: number): Promise<void> => {
  if (!Number.isFinite(blockNumber) || blockNumber < 0) {
    return;
  }

  await ensureDataDirectory();
  const payload = JSON.stringify({ lastBlock: Math.floor(blockNumber) }, null, 2);
  await fs.writeFile(LAST_PROCESSED_BLOCK_PATH, payload, "utf8");
};

/**
 * BullMQ 큐에 전달할 페이로드를 구성합니다.
 * 이벤트 파라미터와 메타 정보를 함께 포함합니다.
 */
const buildPayload = (
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
 * 리스너가 오프라인이었던 구간의 이벤트를 조회하여 큐에 적재합니다.
 * 컨트랙트별로 queryFilter를 수행하고 블록/로그 인덱스 순서로 정렬합니다.
 */
const backfillEvents = async (
  contexts: ContractContext[],
  fromBlock: number,
  toBlock: number,
): Promise<void> => {
  if (fromBlock > toBlock) {
    return;
  }

  console.log("[BlockchainListener] 백필 시작", {
    fromBlock,
    toBlock,
  });

  type BackfillItem = {
    eventName: string;
    contractName: string;
    payload: Record<string, unknown>;
    blockNumber: number;
    logIndex: number;
  };

  const backfillItems: BackfillItem[] = [];

  for (const { contract, contractName, iface } of contexts) {
    const eventFragments = iface.fragments.filter(
      (fragment): fragment is EventFragment => fragment.type === "event",
    );

    for (const fragment of eventFragments) {
      try {
        // bullmq의 타입 제약과 ethers v6의 시그니처 차이로 인한 any 캐스팅
        const logs = await contract.queryFilter(fragment.name as any, fromBlock, toBlock);
        logs.forEach((eventLog) => {
          const enrichedLog = eventLog as EventLog;
          const parsed = iface.parseLog(enrichedLog) as LogDescription;
          const payload = buildPayload(parsed, enrichedLog, contractName);

          backfillItems.push({
            eventName: parsed.name,
            contractName,
            payload,
            blockNumber: eventLog.blockNumber,
            logIndex: eventLog.index,
          });
        });
      } catch (error) {
        console.error("[BlockchainListener] 백필 중 이벤트 조회 실패", {
          contract: contractName,
          event: fragment.name,
          error,
        });
      }
    }
  }

  backfillItems.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) {
      return a.logIndex - b.logIndex;
    }
    return a.blockNumber - b.blockNumber;
  });

  for (const item of backfillItems) {
    try {
      await eventQueue.add(item.eventName, item.payload);
    } catch (error) {
      console.error("[BlockchainListener] 백필 큐 추가 실패", {
        contract: item.contractName,
        event: item.eventName,
        error,
      });
    }
  }

  console.log("[BlockchainListener] 백필 완료", {
    totalEvents: backfillItems.length,
  });
};

/**
 * 실시간 이벤트 스트림을 구독하고 큐에 적재합니다.
 * 각 이벤트 처리 후 마지막 블록 번호를 업데이트합니다.
 */
const registerAllEvents = (
  context: ContractContext,
  onEventProcessed: (blockNumber: number) => Promise<void>,
) => {
  const { contract, contractName, iface } = context;
  const fragments = iface.fragments.filter(
    (fragment): fragment is EventFragment => fragment.type === "event",
  );

  fragments.forEach((fragment) => {
    const eventKey = fragment.format("full");
    contract.on(eventKey as any, async (...listenerArgs: unknown[]) => {
      const event = listenerArgs.at(-1) as EventLog | undefined;
      if (!event || event.removed) {
        return;
      }

      const parsed = iface.parseLog(event as EventLog) as LogDescription;
      const payload = buildPayload(parsed, event as EventLog, contractName);

      try {
        await eventQueue.add(fragment.name, payload);
        await onEventProcessed(event.blockNumber);
        console.log("[BlockchainListener] 실시간 이벤트 큐 추가", {
          contract: contractName,
          event: fragment.name,
          blockNumber: event.blockNumber,
        });
      } catch (error) {
        console.error("[BlockchainListener] 실시간 이벤트 큐 추가 실패", {
          contract: contractName,
          event: fragment.name,
          error,
        });
      }
    });
  });
};

export const initializeEventListeners = async (): Promise<InitializedResources> => {
  if (resources) {
    return resources;
  }

  const wssUrl = resolveEnv("WSS_PROVIDER_URL");
  const marketplaceAddress = resolveEnv("MARKETPLACE_VAULT_ADDRESS");
  const nftVaultAddress = resolveEnv("NFT_VAULT_ADDRESS");

  await ensureRedisConnected();

  const provider = new WebSocketProvider(wssUrl);

  const marketplaceAbi = artifactToAbi(MarketplaceVaultArtifact);
  const nftVaultAbi = artifactToAbi(NftVaultArtifact);

  const marketplaceInterface = new Interface(marketplaceAbi);
  const nftVaultInterface = new Interface(nftVaultAbi);

  const marketplaceVault = new Contract(marketplaceAddress, marketplaceInterface, provider);
  const nftVault = new Contract(nftVaultAddress, nftVaultInterface, provider);

  const contexts: ContractContext[] = [
    { contract: marketplaceVault, contractName: "MarketplaceVault", iface: marketplaceInterface },
    { contract: nftVault, contractName: "NftVault", iface: nftVaultInterface },
  ];

  const lastProcessedBlock = await readLastProcessedBlock();
  const currentBlock = await provider.getBlockNumber();

  console.log("[BlockchainListener] 블록 동기화 상태", {
    lastProcessedBlock,
    currentBlock,
  });

  if (lastProcessedBlock < currentBlock) {
    await backfillEvents(contexts, lastProcessedBlock + 1, currentBlock);
  }

  await writeLastProcessedBlock(currentBlock);

  const handleProcessedBlock = async (blockNumber: number) => {
    try {
      await writeLastProcessedBlock(blockNumber);
    } catch (error) {
      console.error("[BlockchainListener] 마지막 처리 블록 기록 실패", error);
    }
  };

  contexts.forEach((context) => {
    registerAllEvents(context, handleProcessedBlock);
  });

  const cleanup: CleanupFn = async () => {
    contexts.forEach(({ contract }) => contract.removeAllListeners());

    if (provider.destroy) {
      provider.destroy();
    } else if (provider.websocket?.close) {
      provider.websocket.close();
    }

    resources = null;
  };

  resources = {
    provider,
    marketplaceVault,
    nftVault,
    cleanup,
  };

  console.log("[BlockchainListener] 이벤트 리스너 초기화 완료");

  return resources;
};

