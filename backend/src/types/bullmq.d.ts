declare module "bullmq" {
  import type { RedisOptions } from "ioredis";

  export interface Job<T = unknown, R = unknown, N extends string = string> {
    id?: string;
    name: N;
    data: T;
    attemptsMade: number;
  }

  export interface QueueOptions {
    connection?: string | RedisOptions;
    defaultJobOptions?: Record<string, unknown>;
  }

  export class Queue<T = unknown, R = unknown, N extends string = string> {
    constructor(name: string, opts?: QueueOptions);
    add(name: string, data: T, opts?: Record<string, unknown>): Promise<Job<T, R, N>>;
  }

  export interface WorkerOptions {
    connection?: string | RedisOptions;
    concurrency?: number;
  }

  export class Worker<T = unknown, R = unknown, N extends string = string> {
    constructor(
      name: string,
      processor: (job: Job<T, R, N>) => Promise<R> | R,
      opts?: WorkerOptions,
    );
    on(event: "completed", handler: (job: Job<T, R, N>, result?: R) => void): void;
    on(event: "failed", handler: (job: Job<T, R, N> | undefined, error: Error) => void): void;
    on(event: "error", handler: (error: Error) => void): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }
}

