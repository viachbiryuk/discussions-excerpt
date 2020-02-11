import { Field, ID, Int, ObjectType } from 'type-graphql';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';
import { TimestampsTypeSegment } from '~/commons/graphql/type-segments/timestamp.type-segment';
import { DocId } from '~/commons/typings/typescript';
import { DiscussionBounds } from '~/discussions-v2/dto/discussion-bounds.type';

@ObjectType()
export class Discussion extends TimestampsTypeSegment {
  @Field(type => ID)
  public id: DocId;

  @Field({ nullable: true })
  public title: string;

  @Field({ nullable: true })
  public description: string;

  @Field(type => DiscussionType)
  public type: DiscussionType;

  @Field(type => [DiscussionMessage])
  public messages: IDiscussionMessage[];

  @Field(type => Boolean)
  public isActive: boolean;

  @Field(type => DiscussionBounds, { nullable: true })
  public bounds: DiscussionBounds;
}
