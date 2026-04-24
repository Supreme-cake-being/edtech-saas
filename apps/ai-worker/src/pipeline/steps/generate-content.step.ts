import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LessonContent {
  content: string;
  explanation: string;
  quiz: {
    questions: Array<{
      text: string;
      explanation: string;
      order: number;
      options: Array<{
        text: string;
        isCorrect: boolean;
        order: number;
      }>;
    }>;
  };
}

@Injectable()
export class GenerateContentStep {
  private readonly logger = new Logger(GenerateContentStep.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
    this.model = config.get<string>('openai.model') ?? 'gpt-4o-mini';
  }

  async execute(
    lessonTitle: string,
    moduleTitle: string,
    sourceText: string,
  ): Promise<LessonContent> {
    this.logger.log(`Generating content for lesson: ${lessonTitle}`);

    const prompt = `
You are an expert educator. Create detailed lesson content for the following lesson.

Module: "${moduleTitle}"
Lesson: "${lessonTitle}"

Rules:
- Write educational, engaging content (300-500 words)
- Create a simple explanation (2-3 sentences) for beginners
- Create exactly 3 quiz questions with 4 options each (exactly 1 correct)
- Return ONLY valid JSON, no markdown

Expected JSON format:
{
  "content": "Full lesson text here...",
  "explanation": "Simple explanation for beginners...",
  "quiz": {
    "questions": [
      {
        "text": "Question text?",
        "explanation": "Why this answer is correct...",
        "order": 1,
        "options": [
          { "text": "Option A", "isCorrect": true, "order": 1 },
          { "text": "Option B", "isCorrect": false, "order": 2 },
          { "text": "Option C", "isCorrect": false, "order": 3 },
          { "text": "Option D", "isCorrect": false, "order": 4 }
        ]
      }
    ]
  }
}

Source material (use as reference):
${sourceText.substring(0, 3000)}
    `.trim();

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as LessonContent;
  }
}
