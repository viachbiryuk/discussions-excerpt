import { ObjectType, Field, ID } from 'type-graphql';
import { DocId } from '~/commons/typings/typescript';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';

@ObjectType()
export class RemovedDiscussionMessage {
  @Field(type => ID)
  public messageId: DocId;

  @Field(type => DiscussionMessage, { nullable: true })
  public parent: IDiscussionMessage;

  @Field(type => DiscussionMessage, { nullable: true })
  public root: IDiscussionMessage;

  @Field(type => Discussion)
  public discussion: IDiscussion;
}
