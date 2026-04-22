import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CourseModel } from './models/course.model';
import { CreateCourseInput } from './dto/create-course.input';
import { UpdateCourseInput } from './dto/update-course.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => CourseModel)
@UseGuards(JwtAuthGuard)
export class CoursesResolver {
  constructor(private coursesService: CoursesService) {}

  @Query(() => [CourseModel])
  async myCourses(@CurrentUser() user: any) {
    return this.coursesService.findAll(user.id);
  }

  @Query(() => CourseModel)
  async course(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: any) {
    return this.coursesService.findOne(id, user.id);
  }

  @Mutation(() => CourseModel)
  async createCourse(@Args('input') input: CreateCourseInput, @CurrentUser() user: any) {
    return this.coursesService.create(input, user.id);
  }

  @Mutation(() => CourseModel)
  async updateCourse(@Args('input') input: UpdateCourseInput, @CurrentUser() user: any) {
    return this.coursesService.update(input, user.id);
  }

  @Mutation(() => Boolean)
  async deleteCourse(@Args('id', { type: () => ID }) id: string, @CurrentUser() user: any) {
    return this.coursesService.remove(id, user.id);
  }
}
