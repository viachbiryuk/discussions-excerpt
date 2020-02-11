import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '~/auth/guards/auth.guard';
import { UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { CurrentUser } from '~/auth/param-decorators/current-user.decorator';
import { IUser } from '~/users/interfaces/user.interface';
import { UserRole } from '~/users/user-role';
import { ForRoles } from '~/auth/for-roles.decorator';
import { UpdateDiscussionMessageInput } from '../dto/update-discussion-message.input';
import { RolesGuard } from '~/auth/guards/roles.guard';
import {
  ClientFilterArg,
  IdArg,
  OptArg,
  ReqArg,
} from '~/commons/graphql/shortcut-decorators';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { DiscussionMessageInput } from '~/discussions-v2/dto/discussion-message.input';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DiscussionsService } from '~/discussions-v2/services/discussions.service';
import { DiscussionMessageOwnerOnlyGuard } from '~/discussions-v2/guards/discussion-message-owner-only.guard';
import { messageIdArgName } from '~/commons/graphql/arg-namings';
import { DiscussionForGroupsInput } from '~/discussions-v2/dto/discussion-for-groups.input';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { SubscriptionName } from '~/notifications/platform-notifications/subscription-name';
import { Subscriptions } from '~/commons/subscriptions';
import { DiscussionMessageFilterByInput } from '~/discussions-v2/dto/discussion-message-filter-by.input';
import { ClientFilterInput } from '~/commons/graphql/types-and-inputs/client-filter.input';
import { ID, Int } from 'type-graphql';
import { UpdateDiscussionForGroupsInput } from '~/discussions-v2/dto/update-discussion-for-groups.input';
import { idsMatch } from '~/commons/utils/ids.utils';
import { pickParent, pickRoot } from '~/commons/utils/materialized-path.utils';

@UseGuards(AuthGuard, RolesGuard)
@Resolver()
export class DiscussionsResolver {
  constructor(
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly discussionsService: DiscussionsService,
    private readonly subscriptions: Subscriptions,
  ) {}

  @ForRoles(UserRole.Tutor)
  @Mutation(returns => Boolean)
  public async updateDiscussionForGroups(
    @IdArg('discussionId') discussionId: string,
    @ReqArg('discussion', UpdateDiscussionForGroupsInput)
    discussion: UpdateDiscussionForGroupsInput,
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    return this.discussionsService.updateTopicDiscussionForGroups(
      discussionId,
      discussion,
      currentUser.id,
    );
  }

  @ForRoles(UserRole.Tutor)
  @Mutation(returns => Discussion)
  public async createTopicDiscussionForGroups(
    @ReqArg('discussion', DiscussionForGroupsInput)
    discussion: DiscussionForGroupsInput,
    @CurrentUser() currentUser: IUser,
  ): Promise<IDiscussion> {
    return this.discussionsService.createTopicDiscussionForGroups(
      discussion,
      currentUser.id,
    );
  }

  @ForRoles(UserRole.Tutor)
  @Mutation(returns => Boolean)
  public removeDiscussion(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    return this.discussionsService.removeDiscussionAndItsMessages(
      discussionId,
      currentUser.id,
    );
  }

  @Mutation(returns => DiscussionMessage)
  public async addMessageToDiscussion(
    @IdArg('discussionId') discussionId: string,
    @ReqArg('message', DiscussionMessageInput) message: DiscussionMessageInput,
    @CurrentUser() currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    return this.discussionsService.addMessageToDiscussion(
      discussionId,
      message,
      currentUser,
    );
  }

  @Mutation(returns => DiscussionMessage)
  public async replyToDiscussionMessage(
    @IdArg('parentId') parentId: string,
    @ReqArg('message', DiscussionMessageInput) message: DiscussionMessageInput,
    @CurrentUser() currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    return this.discussionsService.replyToDiscussionMessage(
      parentId,
      message,
      currentUser,
    );
  }

  @UseGuards(DiscussionMessageOwnerOnlyGuard)
  @Mutation(returns => Boolean)
  public async updateMessageInDiscussion(
    @IdArg(messageIdArgName) messageId: string,
    @ReqArg('message', UpdateDiscussionMessageInput)
    message: UpdateDiscussionMessageInput,
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    const isUpdated = await this.discussionMessagesService.updateOneById(
      messageId,
      Object.assign(message, {
        textUpdatedAt: Date.now(),
      }),
    );
    const updatedMessage = await this.discussionMessagesService.findOneByIdOrFail(
      messageId,
    );
    await this.subscriptions.publish(
      SubscriptionName.onMessageUpdateInDiscussion,
      Object.assign(updatedMessage, {
        raisedBy: currentUser.id,
      }),
    );
    return isUpdated;
  }

  @ForRoles(UserRole.Tutor, UserRole.Admin, UserRole.Manager)
  @Mutation(returns => Boolean)
  public async updatePinnedStateForDiscussionMessage(
    @IdArg('messageId') messageId: string,
    @ReqArg('isPinned', Boolean) isPinned: boolean,
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    const isUpdated = await this.discussionMessagesService.updateOneById(
      messageId,
      {
        isPinned,
      },
    );

    const message = await this.discussionMessagesService.findOneByIdOrFail(
      messageId,
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessagePinsInDiscussion,
      Object.assign(message, {
        raisedBy: currentUser.id,
      }),
    );

    return isUpdated;
  }

  @Mutation(returns => Boolean)
  public async removeMessageFromDiscussion(
    @IdArg('messageId') messageId: string,
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    const message = await this.discussionMessagesService.findOneByIdOrFail(
      messageId,
    );

    if (
      currentUser.role !== UserRole.Admin &&
      currentUser.role !== UserRole.Manager &&
      !idsMatch(message.user, currentUser.id)
    ) {
      const errorMessage =
        'Only the owner/admin/manager can remove a discussion message!';
      throw new UnprocessableEntityException(errorMessage);
    }

    const removedCount = await this.discussionMessagesService.removeMessagesAndItsReplies(
      messageId,
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessageRemoveInDiscussion,
      {
        raisedBy: currentUser.id,
        root: pickRoot(message.path),
        parent: pickParent(message.path),
        message: message.id,
        discussion: message.discussion,
      },
    );

    return Boolean(removedCount);
  }

  @Mutation(returns => Boolean)
  public async upvoteDiscussionMessage(
    @IdArg('messageId') messageId: string,
    @CurrentUser() currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const updatedMessage = await this.discussionMessagesService.putVoteForMessage(
      messageId,
      currentUser.id,
      true,
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessageVoteInDiscussion,
      Object.assign(updatedMessage, {
        raisedBy: currentUser.id,
      }),
    );

    return updatedMessage;
  }

  @Mutation(returns => Boolean)
  public async downvoteDiscussionMessage(
    @IdArg('messageId') messageId: string,
    @CurrentUser() currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const updatedMessage = await this.discussionMessagesService.putVoteForMessage(
      messageId,
      currentUser.id,
      false,
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessageVoteInDiscussion,
      Object.assign(updatedMessage, {
        raisedBy: currentUser.id,
      }),
    );

    return updatedMessage;
  }

  @Mutation(returns => Boolean)
  public markDiscussionAsActive(
    @IdArg('discussionId') discussionId: string,
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    return this.discussionsService.markDiscussionAsActive(discussionId);
  }

  @Query(returns => Discussion)
  public fetchDiscussion(
    @IdArg('discussionId') discussionId: string,
  ): Promise<IDiscussion> {
    return this.discussionsService.findOneByIdOrFail(discussionId);
  }

  @Query(returns => DiscussionMessage)
  public fetchDiscussionMessage(
    @IdArg('messageId') messageId: string,
  ): Promise<IDiscussionMessage> {
    return this.discussionMessagesService.findOneByIdOrFail(messageId);
  }

  @Query(returns => [DiscussionMessage], {
    description: 'Returns root messages if filterBy is not applied',
  })
  public fetchDiscussionMessages(
    @IdArg('discussionId') discussionId: string,
    @OptArg('filterBy', DiscussionMessageFilterByInput)
    filterBy: DiscussionMessageFilterByInput,
    @ClientFilterArg() clientFilter: ClientFilterInput,
  ): Promise<IDiscussionMessage[]> {
    return this.discussionMessagesService.fetchMessagesOfDiscussion(
      discussionId,
      filterBy,
      clientFilter,
    );
  }

  @Query(returns => Int, {
    description: 'Counts root messages if filterBy is not applied',
  })
  public countDiscussionMessages(
    @IdArg('discussionId') discussionId: string,
    @OptArg('filterBy', DiscussionMessageFilterByInput)
    filterBy: DiscussionMessageFilterByInput,
    @ClientFilterArg() clientFilter: ClientFilterInput,
  ): Promise<number> {
    return this.discussionMessagesService.countMessagesOfDiscussion(
      discussionId,
      filterBy,
      clientFilter,
    );
  }

  @ForRoles(UserRole.Tutor)
  @Mutation(returns => Boolean)
  public async repostMessageToDiscussions(
    @IdArg('messageId') messageId: string,
    @ReqArg('discussionsIds', [ID]) discussionIds: string[],
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    return this.discussionsService.cloneMessageToDiscussions(
      messageId,
      discussionIds,
      currentUser.id,
    );
  }

  @ForRoles(UserRole.Tutor)
  @Query(returns => [Discussion])
  public async fetchDiscussionsFromTutoredGroups(
    @CurrentUser() currentUser: IUser,
  ): Promise<IDiscussion[]> {
    return this.discussionsService.getDiscussionsFromTutoredGroups(
      currentUser.id,
    );
  }
}
