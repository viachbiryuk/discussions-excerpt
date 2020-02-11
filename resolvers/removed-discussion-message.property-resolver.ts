import { Resolver, Parent, ResolveProperty } from '@nestjs/graphql';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { DiscussionsService } from '~/discussions-v2/services/discussions.service';
import { RemovedDiscussionMessage } from '~/discussions-v2/dto/removed-discussion-message.type';
import { IMessageRemoveInDiscussion } from '~/discussions-v2/interfaces/message-remove-in-discussion.interface';
import { DocId } from '~/commons/typings/typescript';
import { ID } from 'type-graphql';

@Resolver(of => RemovedDiscussionMessage)
export class RemovedDiscussionMessagePropertyResolver {
  constructor(
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly discussionsService: DiscussionsService,
  ) {}

  @ResolveProperty(returns => ID)
  public async messageId(
    @Parent() removedMessage: IMessageRemoveInDiscussion,
  ): Promise<DocId> {
    return removedMessage.message;
  }

  @ResolveProperty(returns => Discussion)
  public async discussion(
    @Parent() removedMessage: IMessageRemoveInDiscussion,
  ): Promise<IDiscussion> {
    return this.discussionsService.findOneByIdOrFail(removedMessage.discussion);
  }

  @ResolveProperty(returns => DiscussionMessage)
  public async parent(
    @Parent() removedMessage: IMessageRemoveInDiscussion,
  ): Promise<IDiscussionMessage> {
    return this.discussionMessagesService.findOneById(removedMessage.parent);
  }

  @ResolveProperty(returns => DiscussionMessage)
  public async root(
    @Parent() removedMessage: IMessageRemoveInDiscussion,
  ): Promise<IDiscussionMessage> {
    return this.discussionMessagesService.findOneById(removedMessage.root);
  }
}
