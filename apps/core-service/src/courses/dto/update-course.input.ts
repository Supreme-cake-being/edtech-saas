import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateCourseInput {
  @Field(() => ID)
  declare id: string;

  @Field({ nullable: true })
  declare title: string | undefined;

  @Field({ nullable: true })
  declare description: string | undefined;
}
