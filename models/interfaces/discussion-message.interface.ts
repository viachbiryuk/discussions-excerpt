import { Document } from 'mongoose';
import { IMessageVote } from '~/discussions-v2/models/interfaces/message-vote.interface';
import { ObjectId } from 'bson';
import { IDocumentTimestamps } from '~/commons/database/timestamps.interface';
import { DocId } from '~/commons/typings/typescript';

export interface IDiscussionMessage extends Document, IDocumentTimestamps {
  path: string;
  votes: IMessageVote[];
  discussion: DocId;
  user: DocId;
  text: string;
  imprint: string;
  isPinned: boolean;
  isBroadcast: boolean;
  attachments: DocId[];
  origin?: DocId;
  textUpdatedAt?: Date;
}
