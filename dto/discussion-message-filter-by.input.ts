import { Field, InputType, ID } from 'type-graphql';
import { FetchMessagesApproach } from '~/discussions-v2/enums/fetch-messages-approach.enum';
import { IsMongoId, IsOptional } from 'class-validator';

@InputType()
export class DiscussionMessageFilterByInput {
  @Field(type => FetchMessagesApproach)
  public approach: FetchMessagesApproach;

  @Field(type => ID)
  @IsMongoId()
  @IsOptional()
  public messageId: string;
}
