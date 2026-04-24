import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

export const PUBSUB_TOKEN = 'PUBSUB';

export function createRedisPubSub(): RedisPubSub {
  const options = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  };

  return new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options),
  });
}
