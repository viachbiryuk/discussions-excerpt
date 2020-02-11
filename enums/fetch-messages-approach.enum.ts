import { registerEnumType } from 'type-graphql';

export enum FetchMessagesApproach {
  OffspringOnly = 'OffspringOnly',
  RepliesOnly = 'RepliesOnly',
}

registerEnumType(FetchMessagesApproach, {
  name: 'fetchMessagesApproach',
  description: 'Approach to fetch messages of discussion',
});
