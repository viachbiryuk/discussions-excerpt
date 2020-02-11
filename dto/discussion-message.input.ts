import { Field, InputType, ID, Int } from 'type-graphql';

@InputType()
export class DiscussionMessageInput {
  @Field()
  public text: string;

  @Field(type => Boolean, { defaultValue: false })
  public isPinned: boolean;
}
