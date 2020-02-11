import { DocId } from '~/commons/typings/typescript';
import { IRaisedBy } from '~/commons/interfaces/raised-by.interface';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';

export interface IDiscussionRemoveInGroup extends IRaisedBy {
  discussion: {
    id: DocId;
    type: DiscussionType;
    host: DocId;
  };
  group: DocId;
}
