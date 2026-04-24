import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PipelineService, PipelineInput } from '../pipeline/pipeline.service';

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private readonly queue = 'course.process';

  constructor(
    private config: ConfigService,
    private pipeline: PipelineService,
  ) {}

  async onModuleInit() {
    await this.startConsuming();
  }

  private async startConsuming() {
    try {
      const url = this.config.get<string>('rabbitmq.url')!;
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();

      await channel.assertQueue(this.queue, { durable: true });

      // Process one message at a time
      channel.prefetch(1);

      this.logger.log(`Listening on queue: ${this.queue}`);

      channel.consume(this.queue, async (msg) => {
        if (!msg) return;

        const input = JSON.parse(msg.content.toString()) as PipelineInput;
        this.logger.log(`Received job: ${input.jobId} for course: ${input.courseId}`);

        try {
          await this.pipeline.run(input);
          channel.ack(msg);
        } catch (error) {
          this.logger.error(`Job failed: ${input.jobId}`, error);
          // Decline without requeue — error already handled in pipeline
          channel.nack(msg, false, false);
        }
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }
}
