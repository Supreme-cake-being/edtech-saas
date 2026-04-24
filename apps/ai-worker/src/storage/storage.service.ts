import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

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

  /** Loads files from R2 and returns a Buffer */
  async downloadFile(key: string): Promise<Buffer> {
    this.logger.log(`Downloading file: ${key}`);

    const response = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
