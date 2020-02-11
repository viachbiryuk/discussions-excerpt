import { ObjectType, Field, ID, Int } from 'type-graphql';
import { User } from '~/users/user.type';
import { IUser } from '~/users/interfaces/user.interface';
import { IMessageVote } from '~/discussions-v2/models/interfaces/message-vote.interface';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { TimestampsTypeSegment } from '~/commons/graphql/type-segments/timestamp.type-segment';
import { MessageVote } from '~/discussions-v2/dto/message-vote.type';
import { DocId } from '~/commons/typings/typescript';

@ObjectType()
export class DiscussionMessage extends TimestampsTypeSegment {
  @Field(type => ID)
  public id: DocId;

  @Field(type => Discussion, { nullable: true })
  public discussion: IDiscussion;

  @Field(type => User)
  public user: IUser;

  @Field()
  public text: string;

  @Field()
  public isPinned: boolean;

  @Field()
  public isBroadcast: boolean;

  @Field({ nullable: true })
  public textUpdatedAt: Date;

  @Field(type => MessageVote, { nullable: true })
  public votes: IMessageVote[];

  @Field(type => Int)
  public votesBalance: number;
}
