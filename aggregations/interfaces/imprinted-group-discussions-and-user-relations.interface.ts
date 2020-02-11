import { ObjectId } from 'bson';
import { IImprintedDiscussions } from '~/discussions-v2/aggregations/interfaces/imprinted-discussions.interface';
import { IGroup } from '~/programs/groups/group.interface';

export interface IImprintedGroupDiscussionsAndUserRelations
  extends IImprintedDiscussions {
  relatedGroupsIds: ObjectId[];
  relatedGroups: IGroup[];
  totalGroupDiscussions: number;
  tutorInGroupDiscussions: ObjectId[];
  notTutorInGroupDiscussions: ObjectId[];
  isTutorInAllImprintedDiscussions: boolean;
}
