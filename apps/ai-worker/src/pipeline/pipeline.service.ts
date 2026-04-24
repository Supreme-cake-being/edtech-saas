import { Injectable, Logger } from '@nestjs/common';
import { prisma, ProcessingStatus } from '@edtech/db';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { ExtractTextStep } from './steps/extract-text.step';
import { GenerateStructureStep } from './steps/generate-structure.step';
import { GenerateContentStep } from './steps/generate-content.step';
import { SaveCourseStep } from './steps/save-course.step';
import { LessonContent } from './steps/generate-content.step';

export interface PipelineInput {
  jobId: string;
  courseId: string;
  fileKey: string;
  fileType: 'PDF' | 'VIDEO';
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private storage: StorageService,
    private redis: RedisService,
    private extractText: ExtractTextStep,
    private generateStructure: GenerateStructureStep,
    private generateContent: GenerateContentStep,
    private saveCourse: SaveCourseStep,
  ) {}

  async run(input: PipelineInput): Promise<void> {
    const { jobId, courseId, fileKey, fileType } = input;

    try {
      // Step 1 — Loading and extracting text
      await this.updateProgress(
        jobId,
        courseId,
        ProcessingStatus.EXTRACTING,
        10,
        'Extracting text from file',
      );
      const fileBuffer = await this.storage.downloadFile(fileKey);
      const text = await this.extractText.execute(fileBuffer, fileType);

      // Step 2 — Generating course structure
      await this.updateProgress(
        jobId,
        courseId,
        ProcessingStatus.CHUNKING,
        30,
        'Analyzing content structure',
      );
      const structure = await this.generateStructure.execute(text);

      // Step 3 — Generating content for each lesson
      await this.updateProgress(
        jobId,
        courseId,
        ProcessingStatus.GENERATING,
        50,
        'Generating lessons and quizzes',
      );

      const lessonContents = new Map<string, LessonContent>();
      const totalLessons = structure.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      let processedLessons = 0;

      for (const moduleData of structure.modules) {
        for (const lessonData of moduleData.lessons) {
          const content = await this.generateContent.execute(
            lessonData.title,
            moduleData.title,
            text,
          );

          const key = `${moduleData.title}::${lessonData.title}`;
          lessonContents.set(key, content);

          processedLessons++;
          const progress = 50 + Math.round((processedLessons / totalLessons) * 35);
          await this.updateProgress(
            jobId,
            courseId,
            ProcessingStatus.GENERATING,
            progress,
            `Generated lesson ${processedLessons}/${totalLessons}: ${lessonData.title}`,
          );
        }
      }

      // Step 4 — Saving to DB
      await this.updateProgress(
        jobId,
        courseId,
        ProcessingStatus.SAVING,
        90,
        'Saving course to database',
      );
      await this.saveCourse.execute(courseId, structure, lessonContents);

      // Completed
      await this.updateProgress(jobId, courseId, ProcessingStatus.DONE, 100, 'Course ready');
      await prisma.course.update({
        where: { id: courseId },
        data: { status: 'PUBLISHED' },
      });

      this.logger.log(`Pipeline completed for course: ${courseId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Pipeline failed for course ${courseId}: ${errorMsg}`);

      await this.updateProgress(
        jobId,
        courseId,
        ProcessingStatus.FAILED,
        0,
        'Processing failed',
        errorMsg,
      );

      await prisma.course.update({
        where: { id: courseId },
        data: { status: 'FAILED' },
      });

      await prisma.processingJob.update({
        where: { courseId },
        data: { status: ProcessingStatus.FAILED, errorMsg },
      });
    }
  }

  private async updateProgress(
    jobId: string,
    courseId: string,
    status: ProcessingStatus,
    progress: number,
    step: string,
    errorMsg?: string,
  ): Promise<void> {
    // Updating the database
    await prisma.processingJob.update({
      where: { courseId },
      data: { status, progress, step, errorMsg },
    });

    // Publishing to Redis for realtime updates
    await this.redis.publishProgress({
      jobId,
      courseId,
      status,
      progress,
      step,
      errorMsg,
    });
  }
}
