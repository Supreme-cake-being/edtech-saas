import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Multer } from 'multer';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const ALLOWED_MIME_TYPES = ['application/pdf', 'video/mp4', 'video/webm', 'video/quicktime'];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload PDF or video file for AI processing' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} not allowed`), false);
        }
      },
    }),
  )
  async uploadFile(
    @Param('id') courseId: string,
    @UploadedFile() file: Express.Multer.File & { buffer: Buffer },
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    await this.coursesService.uploadSourceFile(
      courseId,
      user.id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return { message: 'File uploaded successfully, processing started' };
  }
}
