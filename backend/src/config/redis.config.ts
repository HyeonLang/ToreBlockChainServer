import { config as loadEnv } from "dotenv";
import IORedis, { Redis, RedisOptions } from "ioredis";

loadEnv();

/**
 * Redis 클라이언트를 생성할 때 사용할 옵션을 구성합니다.
 * REDIS_URL이 없는 경우 호스트 기반 접속 설정을 반환합니다.
 */
const buildRedisOptions = (): RedisOptions => {
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
  const username = process.env.REDIS_USERNAME;
  const password = process.env.REDIS_PASSWORD;

  return {
    host,
    port,
    username,
    password,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectionName: process.env.REDIS_CONNECTION_NAME ?? "tore-blockchain-server",
  };
};

const redisUrl = process.env.REDIS_URL;

/**
 * BullMQ에서 사용할 Redis 연결 정보를 제공합니다.
 * URL이 존재하면 그대로 반환하고, 없으면 옵션 객체를 전달합니다.
 */
export const getBullMQConnection = (): string | RedisOptions =>
  redisUrl ?? buildRedisOptions();

/**
 * ioredis 클라이언트를 생성합니다.
 * URL 우선 전략을 적용하여 구성합니다.
 */
const createRedisClient = (): Redis =>
  redisUrl ? new IORedis(redisUrl, buildRedisOptions()) : new IORedis(buildRedisOptions());

export const redisConnection: Redis = createRedisClient();

redisConnection.on("connect", () => {
  console.log("[Redis] 연결 성공");
});

redisConnection.on("error", (error: Error) => {
  console.error("[Redis] 연결 오류:", error);
});

redisConnection.on("close", () => {
  console.warn("[Redis] 연결 종료");
});

/**
 * Redis 클라이언트가 준비되지 않은 경우 연결을 초기화합니다.
 */
export const ensureRedisConnected = async (): Promise<void> => {
  if (redisConnection.status === "ready" || redisConnection.status === "connecting") {
    return;
  }

  await redisConnection.connect();
};

