import { Schema } from 'mongoose';
import { commonSchemaOptions } from '~/commons/database/common-schema-options';

export const messageVoteSchema = new Schema(
  {
    isPositive: {
      type: Boolean,
      default: false,
    },
    user: {
      type: String,
    },
  },
  commonSchemaOptions,
);
