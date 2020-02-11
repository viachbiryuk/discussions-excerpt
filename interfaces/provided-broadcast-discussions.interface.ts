import { DocId } from '~/commons/typings/typescript';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';

export interface IProvidedBroadcastDiscussions {
  createdDiscussions: IDiscussion[];
  discussionsIds: DocId[];
}
