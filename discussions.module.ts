import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { discussionSchema } from '~/discussions-v2/models/schemas/discussion.schema';
import { discussionMessageSchema } from '~/discussions-v2/models/schemas/discussion-message.schema';
import { DiscussionsService } from '~/discussions-v2/services/discussions.service';
import { MessageVotePropertyResolver } from '~/discussions-v2/resolvers/message-vote.property-resolver';
import {
  discussionMessageModelName,
  discussionModelName,
} from '~/discussions-v2/discussions.namings';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { DiscussionsResolver } from '~/discussions-v2/resolvers/discussions.resolver';
import { ProgramsModule } from '~/programs/programs.module';
import { RewardsModule } from '~/rewards/rewards.module';
import { DiscussionSubscriptionsResolver } from '~/discussions-v2/resolvers/discussion.subscriptions-resolver';
import { RemovedDiscussionMessagePropertyResolver } from '~/discussions-v2/resolvers/removed-discussion-message.property-resolver';
import { BroadcastMessagesService } from '~/discussions-v2/services/broadcast-messages.service';
import { BroadcastMessagesResolver } from '~/discussions-v2/resolvers/broadcast-messages.resolver';
import { RemovedDiscussionPropertyResolver } from '~/discussions-v2/resolvers/removed-discussion.property-resolver';
import { DiscussionPropertyResolver } from '~/discussions-v2/resolvers/discussion.property-resolver';
import { DiscussionMessagePropertyResolver } from '~/discussions-v2/resolvers/discussion-message.property-resolver';
import { DiscussionBoundsPropertyResolver } from '~/discussions-v2/resolvers/discussion-bounds.property-resolver';

@Module({
  imports: [
    RewardsModule,
    ProgramsModule,
    MongooseModule.forFeature([
      { name: discussionModelName, schema: discussionSchema },
      { name: discussionMessageModelName, schema: discussionMessageSchema },
    ]),
  ],
  providers: [
    DiscussionsService,
    DiscussionPropertyResolver,
    DiscussionMessagesService,
    DiscussionsResolver,
    DiscussionMessagePropertyResolver,
    MessageVotePropertyResolver,
    DiscussionSubscriptionsResolver,
    RemovedDiscussionMessagePropertyResolver,
    DiscussionBoundsPropertyResolver,
    RemovedDiscussionPropertyResolver,
    BroadcastMessagesService,
    BroadcastMessagesResolver,
  ],
  exports: [DiscussionsService, DiscussionMessagesService],
})
export class DiscussionsModule {}
