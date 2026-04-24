import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@edtech/db';
import { CourseStructure } from './generate-structure.step';
import { LessonContent } from './generate-content.step';

@Injectable()
export class SaveCourseStep {
  private readonly logger = new Logger(SaveCourseStep.name);

  async execute(
    courseId: string,
    structure: CourseStructure,
    lessonContents: Map<string, LessonContent>,
  ): Promise<void> {
    this.logger.log(`Saving course structure to DB: ${courseId}`);

    // Update course title if LLM generated a better one
    await prisma.course.update({
      where: { id: courseId },
      data: { title: structure.title },
    });

    for (const moduleData of structure.modules) {
      const module = await prisma.module.create({
        data: {
          courseId,
          title: moduleData.title,
          order: moduleData.order,
        },
      });

      for (const lessonData of moduleData.lessons) {
        const lessonKey = `${moduleData.title}::${lessonData.title}`;
        const content = lessonContents.get(lessonKey);

        if (!content) continue;

        const lesson = await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: lessonData.title,
            order: lessonData.order,
            content: content.content,
            explanation: content.explanation,
          },
        });

        // Create quiz for each lesson
        const quiz = await prisma.quiz.create({
          data: { lessonId: lesson.id },
        });

        for (const questionData of content.quiz.questions) {
          const question = await prisma.question.create({
            data: {
              quizId: quiz.id,
              text: questionData.text,
              explanation: questionData.explanation,
              order: questionData.order,
            },
          });

          await prisma.option.createMany({
            data: questionData.options.map((opt) => ({
              questionId: question.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          });
        }
      }
    }

    this.logger.log(`Course saved successfully: ${courseId}`);
  }
}
