import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ProcessingStatusEnum {
  PENDING = 'PENDING',
  EXTRACTING = 'EXTRACTING',
  CHUNKING = 'CHUNKING',
  GENERATING = 'GENERATING',
  SAVING = 'SAVING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

registerEnumType(ProcessingStatusEnum, { name: 'ProcessingStatus' });

@ObjectType()
export class ProcessingProgress {
  @Field()
  declare jobId: string;

  @Field()
  declare courseId: string;

  @Field(() => ProcessingStatusEnum)
  declare status: ProcessingStatusEnum;

  @Field(() => Int)
  declare progress: number;

  @Field({ nullable: true })
  declare step?: string;

  @Field({ nullable: true })
  declare errorMsg?: string;
}
