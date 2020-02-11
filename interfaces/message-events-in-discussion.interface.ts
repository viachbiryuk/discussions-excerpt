import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { IRaisedBy } from '~/commons/interfaces/raised-by.interface';

export interface IMessageEventsInDiscussion
  extends IDiscussionMessage,
    IRaisedBy {}
