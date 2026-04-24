import { Module } from '@nestjs/common';
import { PUBSUB_TOKEN, createRedisPubSub } from './redis-pubsub';

@Module({
  providers: [
    {
      provide: PUBSUB_TOKEN,
      useFactory: createRedisPubSub,
    },
  ],
  exports: [PUBSUB_TOKEN],
})
export class PubSubModule {}
