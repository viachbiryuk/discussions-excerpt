import { Resolver, Parent, ResolveProperty } from '@nestjs/graphql';
import { Int } from 'type-graphql';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { UsersService } from '~/users/services/users.service';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { AttachmentsService } from '~/attachments/attachments.service';
import { User } from '~/users/user.type';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { IUser } from '~/users/interfaces/user.interface';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { ClientFilterArg } from '~/commons/graphql/shortcut-decorators';
import { ClientFilterInput } from '~/commons/graphql/types-and-inputs/client-filter.input';
import { CurrentUser } from '~/auth/param-decorators/current-user.decorator';
import { IMessageVote } from '~/discussions-v2/models/interfaces/message-vote.interface';
import { AttachmentRecord } from '~/attachments/dto/attachment-record.type';
import { MessageVote } from '~/discussions-v2/dto/message-vote.type';
import { IAttachmentRecord } from '~/attachments/attachment-record.interface';
import { AttachmentTarget } from '~/attachments/attachment-target';
import { DiscussionsService } from '~/discussions-v2/services/discussions.service';
import {
  buildHasParentRegex,
  buildHasRootRegex,
  countUnits,
  pickParent,
  pickRoot,
} from '~/commons/utils/materialized-path.utils';

@Resolver(of => DiscussionMessage)
export class DiscussionMessagePropertyResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly discussionsService: DiscussionsService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @ResolveProperty(returns => Int)
  public async nestingLevel(
    @Parent() message: IDiscussionMessage,
  ): Promise<number> {
    return countUnits(message.path);
  }

  @ResolveProperty(returns => User)
  public async user(@Parent() message: IDiscussionMessage): Promise<IUser> {
    return this.usersService.findOneByIdOrFail(message.user);
  }

  @ResolveProperty(returns => Discussion)
  public async discussion(
    @Parent() message: IDiscussionMessage,
  ): Promise<IDiscussion> {
    return this.discussionsService.findOneByIdOrFail(message.discussion);
  }

  @ResolveProperty(returns => DiscussionMessage, { nullable: true })
  public async origin(
    @Parent() message: IDiscussionMessage,
  ): Promise<IDiscussionMessage> {
    return this.discussionMessagesService.findOneById(message.origin);
  }

  @ResolveProperty(returns => DiscussionMessage, { nullable: true })
  public async parent(
    @Parent() message: IDiscussionMessage,
  ): Promise<IDiscussionMessage> {
    const parentMessageId = pickParent(message.path);
    return this.discussionMessagesService.findOneById(parentMessageId);
  }

  @ResolveProperty(returns => DiscussionMessage, { nullable: true })
  public async root(
    @Parent() message: IDiscussionMessage,
  ): Promise<IDiscussionMessage> {
    const rootMessageId = pickRoot(message.path);
    return this.discussionMessagesService.findOneById(rootMessageId);
  }

  @ResolveProperty(returns => [DiscussionMessage])
  public async replies(
    @ClientFilterArg() clientFilter: ClientFilterInput,
    @Parent() message: IDiscussionMessage,
  ): Promise<IDiscussionMessage[]> {
    return this.discussionMessagesService.findDiscussionMessages(
      { path: buildHasParentRegex(message.id) },
      clientFilter,
    );
  }

  @ResolveProperty(returns => [DiscussionMessage])
  public async offspring(
    @ClientFilterArg() clientFilter: ClientFilterInput,
    @Parent() message: IDiscussionMessage,
  ): Promise<IDiscussionMessage[]> {
    return this.discussionMessagesService.findDiscussionMessages(
      { path: buildHasRootRegex(message.id) },
      clientFilter,
    );
  }

  @ResolveProperty(returns => Int)
  public async totalOffspring(
    @ClientFilterArg() clientFilter: ClientFilterInput,
    @Parent() message: IDiscussionMessage,
  ): Promise<number> {
    return this.discussionMessagesService.count(
      { path: buildHasRootRegex(message.id) },
      clientFilter,
    );
  }

  @ResolveProperty(returns => Int)
  public async totalReplies(
    @ClientFilterArg() clientFilter: ClientFilterInput,
    @Parent() message: IDiscussionMessage,
  ): Promise<number> {
    return this.discussionMessagesService.count(
      { path: buildHasParentRegex(message.id) },
      clientFilter,
    );
  }

  @ResolveProperty(returns => Int)
  public async totalPositiveVotes(
    @Parent() message: IDiscussionMessage,
    @CurrentUser() currentUser: IUser,
  ): Promise<number> {
    return this.discussionMessagesService.countVotesForMessage(message.id, {
      isPositive: true,
    });
  }

  @ResolveProperty(returns => Int)
  public async totalNegativeVotes(
    @Parent() message: IDiscussionMessage,
    @CurrentUser() currentUser: IUser,
  ): Promise<number> {
    return this.discussionMessagesService.countVotesForMessage(message.id, {
      isPositive: false,
    });
  }

  @ResolveProperty(returns => MessageVote, { nullable: true })
  public async myVote(
    @Parent() message: IDiscussionMessage,
    @CurrentUser() currentUser: IUser,
  ): Promise<IMessageVote> {
    return this.discussionMessagesService.findMessageVoteOfUser(
      message.id,
      currentUser.id,
    );
  }

  @ResolveProperty(returns => [AttachmentRecord])
  public async attachments(
    @ClientFilterArg() clientFilter: ClientFilterInput,
    @Parent() message: IDiscussionMessage,
  ): Promise<IAttachmentRecord[]> {
    return this.attachmentsService.findMany(
      {
        attachmentTarget: AttachmentTarget.DiscussionMessage,
        targetRef: message.id,
      },
      clientFilter,
    );
  }

  @ResolveProperty(returns => Int)
  public async totalPrev(
    @Parent() message: IDiscussionMessage,
  ): Promise<number> {
    return this.discussionMessagesService.count({
      path: message.path,
      discussion: message.discussion,
      createdAt: {
        $gt: message.createdAt,
      },
    });
  }

  @ResolveProperty(returns => Int)
  public async totalNext(
    @Parent() message: IDiscussionMessage,
  ): Promise<number> {
    return this.discussionMessagesService.count({
      path: message.path,
      discussion: message.discussion,
      createdAt: {
        $lt: message.createdAt,
      },
    });
  }

  @ResolveProperty(returns => Boolean)
  public async isBroadcast(
    @Parent() message: IDiscussionMessage,
  ): Promise<boolean> {
    return Boolean(message.isBroadcast);
  }
}
