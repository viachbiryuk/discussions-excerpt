import { Schema } from 'mongoose';
import { commonSchemaOptions } from '~/commons/database/common-schema-options';
import { messageVoteSchema } from '~/discussions-v2/models/schemas/message-vote.schema';
import { discussionMessageModelName } from '~/discussions-v2/discussions.namings';

export const discussionMessageSchema = new Schema(
  {
    path: {
      type: String,
      default: '',
      trim: true,
    },
    votes: {
      type: [messageVoteSchema],
      default: [],
    },
    votesBalance: {
      type: Number,
      default: 0,
    },
    discussion: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    origin: {
      type: Schema.Types.ObjectId,
      ref: discussionMessageModelName,
    },
    textUpdatedAt: {
      type: Date,
    },
    imprint: {
      type: String,
    },
    isBroadcast: {
      type: Boolean,
    },
  },
  commonSchemaOptions,
);
