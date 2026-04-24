import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface ProgressPayload {
  jobId: string;
  courseId: string;
  status: string;
  progress: number;
  step?: string;
  errorMsg?: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
    });
    this.logger.log('Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /** Publishes progress updates to a Redis channel — Gateway subscribes via Pub/Sub */
  async publishProgress(payload: ProgressPayload): Promise<void> {
    const channel = `processingProgress`;
    await this.client.publish(channel, JSON.stringify(payload));
    this.logger.log(`Progress published: ${payload.status} ${payload.progress}%`);
  }
}
