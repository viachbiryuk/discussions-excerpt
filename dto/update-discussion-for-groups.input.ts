import { Field, InputType, ID } from 'type-graphql';

@InputType()
export class UpdateDiscussionForGroupsInput {
  @Field({ nullable: true })
  public title: string;

  @Field({ nullable: true })
  public description: string;

  @Field(type => [ID], { nullable: true })
  public alsoInGroups: string[];
}
