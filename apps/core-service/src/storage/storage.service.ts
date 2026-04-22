import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.get<string>('r2.endpoint'),
      credentials: {
        accessKeyId: config.get<string>('r2.accessKeyId')!,
        secretAccessKey: config.get<string>('r2.secretAccessKey')!,
      },
    });
    this.bucket = config.get<string>('r2.bucketName')!;
  }

  /**
   * Uploads a file to R2 and returns its key
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<string> {
    const ext = originalName.split('.').pop();
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    this.logger.log(`Uploaded file: ${key}`);
    return key;
  }

  /**
   * Generates presigned URL for temporary access to a file (15 minutes by default)
   */
  async getPresignedUrl(key: string, expiresIn: number = 900): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Deletes file from R2
   */
  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    this.logger.log(`Deleted file: ${key}`);
  }
}
