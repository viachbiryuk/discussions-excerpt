import { Field, ID, Int, ObjectType } from 'type-graphql';
import { ProgramWeek } from '~/programs/dto/program-week.type';
import { IProgramWeek } from '~/programs/interfaces/program-week.interface';

@ObjectType()
export class DiscussionBounds {
  @Field(type => ProgramWeek, { nullable: true })
  public week: IProgramWeek;
}
