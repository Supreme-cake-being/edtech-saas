import { Module } from '@nestjs/common';
import { CoursesResolver } from './courses.resolver';
import { CoursesService } from './courses.service';
import { StorageModule } from '../storage/storage.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CoursesController } from './courses.controller';

@Module({
  imports: [StorageModule, MessagingModule],
  providers: [CoursesResolver, CoursesService],
  controllers: [CoursesController],
})
export class CoursesModule {}
