import { ensureRedisConnected } from "../../config/redis.config";
// import { initializeMarketplaceVaultListener } from "./listeners/marketplaceVault.listener";
import { initializeNftVaultListener } from "./listeners/nftVault.listener";

type CleanupFn = () => Promise<void> | void;

interface InitializedResources {
  cleanup: CleanupFn;
}

let resources: InitializedResources | null = null;

/**
 * 이벤트 리스너를 초기화합니다.
 * 
 * 이 함수는 다음 리스너들을 초기화합니다:
 * - MarketplaceVault 리스너: NFTListed, NFTSold, NFTReclaimed 이벤트 구독 (임시 비활성화)
 * - NftVault 리스너: NftLocked, NftUnlocked 이벤트 구독
 * 
 * 각 리스너는 독립적으로 작동하며, 이벤트 발생 시:
 * 1. 각 리스너의 contract.on() 콜백이 실행됨
 * 2. BullMQ 큐에 이벤트 추가
 * 3. blockchain/worker.service.ts의 워커가 큐에서 이벤트를 가져와 메인 서버로 전송
 */
export const initializeEventListeners = async (): Promise<InitializedResources> => {
  if (resources) {
    return resources;
  }

  await ensureRedisConnected();

  // MarketplaceVault 리스너 초기화 (임시 비활성화)
  // NFTListed, NFTSold, NFTReclaimed 이벤트 발생 시 marketplaceVault.listener.ts의 contract.on() 콜백 실행
  // const marketplaceResources = await initializeMarketplaceVaultListener();
  
  // NftVault 리스너 초기화
  // NftLocked, NftUnlocked 이벤트 발생 시 nftVault.listener.ts의 contract.on() 콜백 실행
  const nftVaultResources = await initializeNftVaultListener();

  const cleanup: CleanupFn = async () => {
    // await marketplaceResources.cleanup();
    await nftVaultResources.cleanup();
    resources = null;
  };

  resources = { cleanup };

  console.log("[BlockchainListener] 모든 이벤트 리스너 초기화 완료");

  return resources;
};

// worker.service.ts에서 사용하는 export
// export { MARKETPLACE_QUEUE_NAME } from "./listeners/marketplaceVault.listener"; // 임시 비활성화
export { NFT_VAULT_QUEUE_NAME } from "./listeners/nftVault.listener";
export { toKebabCase } from "./listeners/base.listener";

