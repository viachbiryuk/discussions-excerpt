import { DocId } from '~/commons/typings/typescript';
import { IRaisedBy } from '~/commons/interfaces/raised-by.interface';

export interface IMessageRemoveInDiscussion extends IRaisedBy {
  parent: DocId;
  root: DocId;
  message: DocId;
  discussion: DocId;
}
