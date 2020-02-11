import { ObjectId } from 'bson';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';

export interface IImprintedDiscussions {
  imprintedDiscussionsIds: ObjectId[];
  currentDiscussion: IDiscussion;
  imprintedDiscussions: IDiscussion[];
}
