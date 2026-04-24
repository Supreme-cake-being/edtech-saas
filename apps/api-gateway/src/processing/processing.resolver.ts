import { Inject, UseGuards } from '@nestjs/common';
import { Args, Resolver, Subscription } from '@nestjs/graphql';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PUBSUB_TOKEN } from '../pubsub/redis-pubsub';
import { ProcessingProgress } from './models/processing-progress.model';
import { RedisPubSub } from 'graphql-redis-subscriptions';

export const PROCESSING_PROGRESS_EVENT = 'processingProgress';

@Resolver()
export class ProcessingResolver {
  constructor(@Inject(PUBSUB_TOKEN) private readonly pubSub: RedisPubSub) {}

  /**
   * Client subscribes to the progress of a specific course
   */
  @UseGuards(JwtAuthGuard)
  @Subscription(() => ProcessingProgress, {
    filter: (payload, variables) => payload.processingProgress.courseId === variables.courseId,
  })
  processingProgress(@Args('courseId') courseId: string) {
    return this.pubSub.asyncIterableIterator(PROCESSING_PROGRESS_EVENT);
  }
}
