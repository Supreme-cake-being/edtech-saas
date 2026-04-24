import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { ExtractTextStep } from './steps/extract-text.step';
import { GenerateStructureStep } from './steps/generate-structure.step';
import { GenerateContentStep } from './steps/generate-content.step';
import { SaveCourseStep } from './steps/save-course.step';
import { StorageModule } from '../storage/storage.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [StorageModule, RedisModule],
  providers: [
    PipelineService,
    ExtractTextStep,
    GenerateStructureStep,
    GenerateContentStep,
    SaveCourseStep,
  ],
  exports: [PipelineService],
})
export class PipelineModule {}
