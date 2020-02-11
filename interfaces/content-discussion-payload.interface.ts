import { DocId } from '~/commons/typings/typescript';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';

export interface IContentDiscussionPayload {
  type: DiscussionType.LessonContentDiscussion;
  host: DocId;
}
