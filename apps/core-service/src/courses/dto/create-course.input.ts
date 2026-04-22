import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCourseInput {
  @Field()
  declare title: string;

  @Field({ nullable: true })
  declare description: string | undefined;
}
