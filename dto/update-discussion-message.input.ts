import { Field, InputType, ID } from 'type-graphql';

@InputType()
export class UpdateDiscussionMessageInput {
  @Field()
  public text: string;
}
