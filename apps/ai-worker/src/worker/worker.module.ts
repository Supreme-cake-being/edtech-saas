import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [PipelineModule],
  providers: [WorkerService],
})
export class WorkerModule {}
