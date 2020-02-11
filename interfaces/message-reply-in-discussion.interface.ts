import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DocId } from '~/commons/typings/typescript';

export interface IMessageReplyInDiscussion extends IDiscussionMessage {
  toUser: DocId;
}
