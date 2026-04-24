import { Module } from '@nestjs/common';
import { ProcessingResolver } from './processing.resolver';
import { PubSubModule } from '../pubsub/pubsub.module';

@Module({
  imports: [PubSubModule],
  providers: [ProcessingResolver],
})
export class ProcessingModule {}
