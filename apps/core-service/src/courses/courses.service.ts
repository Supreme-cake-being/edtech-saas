import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma, CourseStatus, SourceFileType } from '@edtech/db';
import { StorageService } from '../storage/storage.service';
import { MessagingService, ProcessingJobMessage } from '../messaging/messaging.service';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
import { randomUUID } from 'crypto';

@Injectable()
export class CoursesService {
  constructor(
    private storage: StorageService,
    private messaging: MessagingService,
  ) {}

  async findAll(userId: string) {
    return prisma.course.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    if (course.ownerId !== userId) throw new ForbiddenException();
    return course;
  }

  async create(input: CreateCourseInput, userId: string) {
    return prisma.course.create({
      data: {
        title: input.title,
        description: input.description,
        ownerId: userId,
        status: CourseStatus.DRAFT,
      },
    });
  }

  async update(input: UpdateCourseInput, userId: string) {
    await this.findOne(input.id, userId);
    return prisma.course.update({
      where: { id: input.id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await prisma.course.delete({ where: { id } });
    return true;
  }

  /**
   * Uploads a file to R2, creates a SourceFile and ProcessingJob,
   * and publishes the job to RabbitMQ
   */
  async uploadSourceFile(
    courseId: string,
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    const course = await this.findOne(courseId, userId);

    // Identify file type
    const fileType: SourceFileType =
      mimeType === 'application/pdf' ? SourceFileType.PDF : SourceFileType.VIDEO;

    // Upload to R2
    const fileKey = await this.storage.uploadFile(
      fileBuffer,
      originalName,
      mimeType,
      `courses/${courseId}`,
    );

    // Save file information
    await prisma.sourceFile.upsert({
      where: { courseId },
      update: { url: fileKey, type: fileType, sizeBytes: fileBuffer.length },
      create: {
        courseId,
        url: fileKey,
        type: fileType,
        sizeBytes: fileBuffer.length,
      },
    });

    // Update course status
    await prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PROCESSING },
    });

    // Create or update ProcessingJob
    const jobId = randomUUID();
    await prisma.processingJob.upsert({
      where: { courseId },
      update: {
        status: 'PENDING',
        progress: 0,
        step: null,
        errorMsg: null,
      },
      create: {
        id: jobId,
        courseId,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Publish to RabbitMQ
    const message: ProcessingJobMessage = {
      jobId,
      courseId,
      fileKey,
      fileType,
    };
    await this.messaging.publishProcessingJob(message);

    return course;
  }
}
