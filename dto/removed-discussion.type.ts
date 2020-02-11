import { ObjectType, Field, ID } from 'type-graphql';
import { DocId } from '~/commons/typings/typescript';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { IGroup } from '~/programs/groups/group.interface';
import { Group } from '~/programs/groups/dto/group.type';

@ObjectType()
export class RemovedDiscussion {}
