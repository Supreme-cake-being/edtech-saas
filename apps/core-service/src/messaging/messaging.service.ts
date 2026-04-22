import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface ProcessingJobMessage {
  jobId: string;
  courseId: string;
  fileKey: string;
  fileType: 'PDF' | 'VIDEO';
}

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);
  private channel: amqp.Channel | null = null;
  private readonly queue = 'course.process';

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const url = this.config.get<string>('rabbitmq.url')!;
      const connection = await amqp.connect(url);
      this.channel = await connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      this.logger.log(`Connected to RabbitMQ, queue: ${this.queue}`);
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
    }
  }

  async publishProcessingJob(message: ProcessingJobMessage): Promise<void> {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel not available');
      return;
    }

    this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    this.logger.log(`Published processing job: ${message.jobId}`);
  }
}
