import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class ExtractTextStep {
  private readonly logger = new Logger(ExtractTextStep.name);

  async execute(fileBuffer: Buffer, fileType: 'PDF' | 'VIDEO'): Promise<string> {
    this.logger.log(`Extracting text from ${fileType}`);

    if (fileType === 'PDF') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    }

    // VIDEO — transcription using Whisper (ToDo in the future)
    throw new Error('Video transcription not yet implemented');
  }
}
