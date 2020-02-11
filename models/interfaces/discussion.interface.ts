import { Document } from 'mongoose';
import { TranslationsInput } from '~/commons/graphql/types-and-inputs/translations.input';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';
import { ObjectId } from 'bson';
import { DocId } from '~/commons/typings/typescript';
import { IDiscussionBounds } from '~/discussions-v2/models/interfaces/discussion-bounds.interface';

export interface IDiscussion extends Document {
  title: TranslationsInput;
  description: TranslationsInput;
  type: DiscussionType;
  host: ObjectId;
  imprint: string;
  isActive: boolean;
  bounds: IDiscussionBounds;
}
