import { Schema } from 'mongoose';
import { translationsHashType } from '~/commons/database/field-types/translations-hash.type';
import { commonSchemaOptions } from '~/commons/database/common-schema-options';
import { keys } from 'lodash';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';

export const discussionSchema = new Schema(
  {
    title: {
      type: translationsHashType,
      default: null,
    },
    description: {
      type: translationsHashType,
      default: null,
    },
    type: {
      type: String,
      enum: keys(DiscussionType),
      required: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    bounds: {
      week: {
        type: Schema.Types.ObjectId,
      },
    },
    imprint: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  commonSchemaOptions,
);
