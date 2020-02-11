import { Field, InputType, ID, Int } from 'type-graphql';
import { IsMongoId, IsOptional } from 'class-validator';

@InputType()
export class DiscussionForGroupsInput {
  @Field()
  public title: string;

  @Field()
  public description: string;

  @Field(type => ID)
  public inGroup: string;

  @Field(type => [ID], { nullable: true })
  public alsoInGroups: string[];

  @Field(type => ID, { nullable: true })
  @IsMongoId()
  @IsOptional()
  public bindToWeek: string;
}
