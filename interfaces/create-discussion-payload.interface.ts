import { IUpdateDiscussionPayload } from '~/discussions-v2/interfaces/update-discussion-payload.interface';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';
import { DocId } from '~/commons/typings/typescript';

export interface ICreateDiscussionPayload extends IUpdateDiscussionPayload {
  type: DiscussionType;
  host: DocId;
  imprint?: string;
  bounds?: {
    week: DocId;
  };
}
