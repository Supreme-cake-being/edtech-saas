import { Directive, Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CourseStatus } from '@edtech/db';

registerEnumType(CourseStatus, { name: 'CourseStatus' });

@ObjectType()
@Directive('@key(fields: "id")')
export class CourseModel {
  @Field(() => ID)
  declare id: string;

  @Field()
  declare title: string;

  @Field({ nullable: true })
  declare description: string | undefined;

  @Field()
  declare ownerId: string;

  @Field(() => CourseStatus)
  declare status: CourseStatus;

  @Field()
  declare createdAt: Date;

  @Field()
  declare updatedAt: Date;
}
