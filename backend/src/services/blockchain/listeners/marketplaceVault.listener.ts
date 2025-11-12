import {
  Contract,
  EventFragment,
  EventLog,
  Interface,
  LogDescription,
  WebSocketProvider,
} from "ethers";
import { Queue } from "bullmq";
import MarketplaceVaultArtifact from "../../../../../blockchain/artifacts/blockchain/contracts/MarketplaceVault.sol/MarketplaceVault.json";
import {
  artifactToAbi,
  buildPayload,
  createEventQueue,
  readLastProcessedBlock,
  resolveEnv,
  writeLastProcessedBlock,
} from "./base.listener";

export const MARKETPLACE_QUEUE_NAME = "marketplace-events";

interface MarketplaceVaultListenerResources {
  provider: WebSocketProvider;
  contract: Contract;
  queue: Queue<Record<string, unknown>>;
  cleanup: () => Promise<void>;
}

let marketplaceResources: MarketplaceVaultListenerResources | null = null;

/**
 * MarketplaceVault 컨트랙트의 특정 이벤트만 백필합니다.
 * 리스너가 오프라인이었던 구간의 이벤트를 조회하여 큐에 적재합니다.
 */
const backfillMarketplaceEvents = async (
  contract: Contract,
  iface: Interface,
  fromBlock: number,
  toBlock: number,
  queue: Queue<Record<string, unknown>>,
): Promise<void> => {
  if (fromBlock > toBlock) {
    return;
  }

  console.log("[MarketplaceVaultListener] 백필 시작", {
    fromBlock,
    toBlock,
  });

  // MarketplaceVault의 이벤트만 필터링
  const targetEvents = ["NFTListed", "NFTSold", "NFTReclaimed"];
  const eventFragments = iface.fragments.filter(
    (fragment): fragment is EventFragment => {
      if (fragment.type !== "event") return false;
      return "name" in fragment && typeof fragment.name === "string" && targetEvents.includes(fragment.name);
    },
  );

  type BackfillItem = {
    eventName: string;
    payload: Record<string, unknown>;
    blockNumber: number;
    logIndex: number;
  };

  const backfillItems: BackfillItem[] = [];

  for (const fragment of eventFragments) {
    try {
      const logs = await contract.queryFilter(fragment.name as any, fromBlock, toBlock);
      logs.forEach((eventLog) => {
        const enrichedLog = eventLog as EventLog;
        const parsed = iface.parseLog(enrichedLog) as LogDescription;
        const payload = buildPayload(parsed, enrichedLog, "MarketplaceVault");

        backfillItems.push({
          eventName: parsed.name,
          payload,
          blockNumber: eventLog.blockNumber,
          logIndex: eventLog.index,
        });
      });
    } catch (error) {
      console.error("[MarketplaceVaultListener] 백필 중 이벤트 조회 실패", {
        event: fragment.name,
        error,
      });
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
      await queue.add(item.eventName, item.payload);
    } catch (error) {
      console.error("[MarketplaceVaultListener] 백필 큐 추가 실패", {
        event: item.eventName,
        error,
      });
    }
  }

  console.log("[MarketplaceVaultListener] 백필 완료", {
    totalEvents: backfillItems.length,
  });
};

/**
 * MarketplaceVault의 실시간 이벤트를 구독하고 큐에 적재합니다.
 * 
 * 이 함수는 다음 이벤트들을 구독합니다:
 * - NFTListed: NFT가 리스팅되었을 때 발생 → registerMarketplaceEvents() → contract.on() 콜백 실행
 * - NFTSold: NFT가 판매되었을 때 발생 → registerMarketplaceEvents() → contract.on() 콜백 실행
 * - NFTReclaimed: NFT가 회수되었을 때 발생 → registerMarketplaceEvents() → contract.on() 콜백 실행
 * 
 * 각 이벤트 발생 시 실행 흐름:
 * 1. contract.on() 콜백이 트리거됨
 * 2. 이벤트 로그를 파싱하여 페이로드 생성
 * 3. BullMQ 큐에 이벤트 추가 (queue.add())
 * 4. 마지막 처리 블록 번호 업데이트 (onEventProcessed())
 */
const registerMarketplaceEvents = (
  contract: Contract,
  iface: Interface,
  queue: Queue<Record<string, unknown>>,
  onEventProcessed: (blockNumber: number) => Promise<void>,
) => {
  const targetEvents = ["NFTListed", "NFTSold", "NFTReclaimed"];
  const fragments = iface.fragments.filter(
    (fragment): fragment is EventFragment => {
      if (fragment.type !== "event") return false;
      return "name" in fragment && typeof fragment.name === "string" && targetEvents.includes(fragment.name);
    },
  );

  fragments.forEach((fragment) => {
    const eventKey = fragment.format("full");
    
    /**
     * 이벤트 발생 시 실행되는 콜백 함수
     * 
     * MarketplaceVault 컨트랙트에서 다음 이벤트가 발생하면 이 함수가 실행됩니다:
     * - NFTListed 이벤트 발생 시
     * - NFTSold 이벤트 발생 시
     * - NFTReclaimed 이벤트 발생 시
     * 
     * 실행 순서:
     * 1. 이벤트 로그 파싱 (iface.parseLog())
     * 2. 페이로드 생성 (buildPayload())
     * 3. BullMQ 큐에 작업 추가 (queue.add())
     * 4. 블록 번호 업데이트 (onEventProcessed())
     */
    contract.on(eventKey as any, async (...listenerArgs: unknown[]) => {
      const event = listenerArgs.at(-1) as EventLog | undefined;
      if (!event || event.removed) {
        return;
      }

      const parsed = iface.parseLog(event as EventLog) as LogDescription;
      const payload = buildPayload(parsed, event as EventLog, "MarketplaceVault");

      try {
        await queue.add(fragment.name, payload);
        await onEventProcessed(event.blockNumber);
        console.log("[MarketplaceVaultListener] 실시간 이벤트 큐 추가", {
          event: fragment.name,
          blockNumber: event.blockNumber,
        });
      } catch (error) {
        console.error("[MarketplaceVaultListener] 실시간 이벤트 큐 추가 실패", {
          event: fragment.name,
          error,
        });
      }
    });
  });
};

/**
 * MarketplaceVault 이벤트 리스너를 초기화합니다.
 * 
 * 초기화 과정:
 * 1. WebSocketProvider 연결
 * 2. MarketplaceVault 컨트랙트 인스턴스 생성
 * 3. BullMQ 큐 생성
 * 4. 백필 처리 (오프라인 구간의 이벤트 조회)
 * 5. 실시간 이벤트 구독 시작 (registerMarketplaceEvents())
 */
export const initializeMarketplaceVaultListener = async (): Promise<MarketplaceVaultListenerResources> => {
  if (marketplaceResources) {
    return marketplaceResources;
  }

  const wssUrl = resolveEnv("WSS_PROVIDER_URL");
  const marketplaceAddress = resolveEnv("MARKETPLACE_VAULT_ADDRESS");

  const provider = new WebSocketProvider(wssUrl);
  const marketplaceAbi = artifactToAbi(MarketplaceVaultArtifact);
  const marketplaceInterface = new Interface(marketplaceAbi);
  const marketplaceVault = new Contract(marketplaceAddress, marketplaceInterface, provider);

  const queue = createEventQueue(MARKETPLACE_QUEUE_NAME);

  const lastProcessedBlock = await readLastProcessedBlock();
  const currentBlock = await provider.getBlockNumber();

  console.log("[MarketplaceVaultListener] 블록 동기화 상태", {
    lastProcessedBlock,
    currentBlock,
  });

  if (lastProcessedBlock < currentBlock) {
    await backfillMarketplaceEvents(marketplaceVault, marketplaceInterface, lastProcessedBlock + 1, currentBlock, queue);
  }

  await writeLastProcessedBlock(currentBlock);

  const handleProcessedBlock = async (blockNumber: number) => {
    try {
      await writeLastProcessedBlock(blockNumber);
    } catch (error) {
      console.error("[MarketplaceVaultListener] 마지막 처리 블록 기록 실패", error);
    }
  };

  // 실시간 이벤트 구독 시작
  // NFTListed, NFTSold, NFTReclaimed 이벤트 발생 시 registerMarketplaceEvents() 내부의 contract.on() 콜백이 실행됨
  registerMarketplaceEvents(marketplaceVault, marketplaceInterface, queue, handleProcessedBlock);

  const cleanup = async () => {
    marketplaceVault.removeAllListeners();

    if (provider.destroy) {
      provider.destroy();
    } else if (provider.websocket?.close) {
      provider.websocket.close();
    }

    marketplaceResources = null;
  };

  marketplaceResources = {
    provider,
    contract: marketplaceVault,
    queue,
    cleanup,
  };

  console.log("[MarketplaceVaultListener] 이벤트 리스너 초기화 완료");

  return marketplaceResources;
};

