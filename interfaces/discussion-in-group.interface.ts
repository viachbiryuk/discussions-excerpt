import { DocId } from '~/commons/typings/typescript';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { IRaisedBy } from '~/commons/interfaces/raised-by.interface';

export interface IDiscussionInGroup extends IDiscussion, IRaisedBy {}
