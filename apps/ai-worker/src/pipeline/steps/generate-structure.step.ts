import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface CourseStructure {
  title: string;
  modules: Array<{
    title: string;
    order: number;
    lessons: Array<{
      title: string;
      order: number;
    }>;
  }>;
}

@Injectable()
export class GenerateStructureStep {
  private readonly logger = new Logger(GenerateStructureStep.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
    this.model = config.get<string>('openai.model') ?? 'gpt-4o-mini';
  }

  async execute(text: string): Promise<CourseStructure> {
    this.logger.log('Generating course structure...');

    const prompt = `
You are an expert course designer. Analyze the following text and create a structured online course outline.

Rules:
- Create 3-7 modules
- Each module should have 2-5 lessons
- Titles should be clear and educational
- Return ONLY valid JSON, no markdown, no explanation

Expected JSON format:
{
  "title": "Course Title",
  "modules": [
    {
      "title": "Module Title",
      "order": 1,
      "lessons": [
        { "title": "Lesson Title", "order": 1 }
      ]
    }
  ]
}

Text to analyze:
${text.substring(0, 8000)}
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as CourseStructure;
  }
}
