import { Resolver, Subscription } from '@nestjs/graphql';
import { AuthGuard } from '~/auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '~/auth/param-decorators/current-user.decorator';
import { IUser } from '~/users/interfaces/user.interface';
import { RolesGuard } from '~/auth/guards/roles.guard';
import { IdArg } from '~/commons/graphql/shortcut-decorators';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { DiscussionsService } from '~/discussions-v2/services/discussions.service';
import { SubscriptionName } from '~/notifications/platform-notifications/subscription-name';
import { Subscriptions } from '~/commons/subscriptions';
import { SubscriptionIterator } from '~/commons/typings/typescript';
import { IMessageReplyInDiscussion } from '~/discussions-v2/interfaces/message-reply-in-discussion.interface';
import { idsMatch } from '~/commons/utils/ids.utils';
import { IMessageRemoveInDiscussion } from '~/discussions-v2/interfaces/message-remove-in-discussion.interface';
import { RemovedDiscussionMessage } from '~/discussions-v2/dto/removed-discussion-message.type';
import { IMessageEventsInDiscussion } from '~/discussions-v2/interfaces/message-events-in-discussion.interface';
import { IDiscussionInGroup } from '~/discussions-v2/interfaces/discussion-in-group.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { IDiscussionRemoveInGroup } from '~/discussions-v2/interfaces/discussion-remove-in-group.interface';
import { RemovedDiscussion } from '~/discussions-v2/dto/removed-discussion.type';

@UseGuards(AuthGuard, RolesGuard)
@Resolver()
export class DiscussionSubscriptionsResolver {
  constructor(
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly discussionsService: DiscussionsService,
    private readonly subscriptions: Subscriptions,
  ) {}

  @Subscription(returns => DiscussionMessage)
  public onMessageInDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessageCreateInDiscussion,
      (message: IMessageEventsInDiscussion) => {
        return (
          idsMatch(discussionId, message.discussion) &&
          !idsMatch(currentUser.id, message.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => DiscussionMessage)
  public onMessageUpdateInDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessageUpdateInDiscussion,
      (message: IMessageEventsInDiscussion) => {
        return (
          idsMatch(discussionId, message.discussion) &&
          !idsMatch(currentUser.id, message.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => DiscussionMessage)
  public onMessageVoteInDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessageVoteInDiscussion,
      (message: IMessageEventsInDiscussion) => {
        return (
          idsMatch(discussionId, message.discussion) &&
          !idsMatch(currentUser.id, message.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => DiscussionMessage)
  public onMessageAttachmentsInDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessageAttachmentsInDiscussion,
      (message: IMessageEventsInDiscussion) => {
        return (
          idsMatch(discussionId, message.discussion) &&
          !idsMatch(currentUser.id, message.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => DiscussionMessage)
  public onMessagePinsInDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessagePinsInDiscussion,
      (message: IMessageEventsInDiscussion) => {
        return (
          idsMatch(discussionId, message.discussion) &&
          !idsMatch(currentUser.id, message.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => RemovedDiscussionMessage)
  public onMessageRemoveInDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessageRemoveInDiscussion,
      (message: IMessageRemoveInDiscussion) => {
        return (
          idsMatch(discussionId, message.discussion) &&
          !idsMatch(currentUser.id, message.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => DiscussionMessage)
  public onMessageReplyInDiscussions(
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onMessageReplyInDiscussions,
      (reply: IMessageReplyInDiscussion) => {
        return idsMatch(currentUser.id, reply.toUser);
      },
    );
  }

  @Subscription(returns => Discussion)
  public onDiscussionCreateInGroup(
    @IdArg('groupId') groupId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onDiscussionCreateInGroup,
      (discussion: IDiscussionInGroup) => {
        return (
          idsMatch(groupId, discussion.host) &&
          !idsMatch(currentUser.id, discussion.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => Discussion)
  public onDiscussionUpdateInGroup(
    @IdArg('groupId') groupId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onDiscussionUpdateInGroup,
      (discussion: IDiscussionInGroup) => {
        return (
          idsMatch(groupId, discussion.host) &&
          !idsMatch(currentUser.id, discussion.raisedBy)
        );
      },
    );
  }

  @Subscription(returns => RemovedDiscussion)
  public onDiscussionRemoveInGroup(
    @IdArg('groupId') groupId: string,
    @CurrentUser() currentUser: IUser,
  ): SubscriptionIterator {
    return this.subscriptions.subscribe(
      SubscriptionName.onDiscussionRemoveInGroup,
      (removed: IDiscussionRemoveInGroup) => {
        return (
          idsMatch(groupId, removed.discussion.host) &&
          !idsMatch(currentUser.id, removed.raisedBy)
        );
      },
    );
  }
}
