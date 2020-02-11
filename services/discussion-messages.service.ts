import { Injectable } from '@nestjs/common';
import { AbstractService } from '~/commons/abstract/abstract.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMessageVote } from '~/discussions-v2/models/interfaces/message-vote.interface';
import { AnyObject, DocId } from '~/commons/typings/typescript';
import { ClientFilterInput } from '~/commons/graphql/types-and-inputs/client-filter.input';
import { OrderByDirection } from '~/commons/graphql/types-and-inputs/order-by-direction';
import { discussionMessageModelName } from '~/discussions-v2/discussions.namings';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DiscussionMessageFilterByInput } from '~/discussions-v2/dto/discussion-message-filter-by.input';
import { FetchMessagesApproach } from '~/discussions-v2/enums/fetch-messages-approach.enum';
import {
  buildHasAncestorsRegex,
  buildHasParentRegex,
} from '~/commons/utils/materialized-path.utils';
import { totalVotesForMessage } from '~/discussions-v2/aggregations/queries/for-discussion-messages/total-votes-for-message.query';
import { isNotEmpty } from '~/commons/utils/assertion.utils';
import { mergeQueryFilters, normalizeClientFilterForSearch } from '~/commons/utils/query-filter.utils';

@Injectable()
export class DiscussionMessagesService extends AbstractService<
  IDiscussionMessage
> {
  constructor(
    @InjectModel(discussionMessageModelName)
    private readonly model: Model<IDiscussionMessage>,
  ) {
    super(model);
  }

  public async removeMessagesAndItsReplies(messageId: DocId) {
    const message = await this.findOneByIdOrFail(messageId);
    return this.removeMany({
      $or: [
        { path: buildHasAncestorsRegex([message.id]) },
        { _id: message.id },
      ],
    });
  }

  public async fetchMessagesOfDiscussion(
    discussionId: DocId,
    filterBy: DiscussionMessageFilterByInput,
    clientFilter: ClientFilterInput,
  ): Promise<IDiscussionMessage[]> {
    const queryFilter = this.buildQueryFilterToFetchMessages(
      discussionId,
      filterBy,
    );
    return this.findDiscussionMessages(queryFilter, clientFilter);
  }

  public async countMessagesOfDiscussion(
    discussionId: DocId,
    filterBy: DiscussionMessageFilterByInput,
    clientFilter: ClientFilterInput,
  ): Promise<number> {
    const queryFilter = this.buildQueryFilterToFetchMessages(
      discussionId,
      filterBy,
    );
    return this.count(queryFilter, clientFilter);
  }

  private buildQueryFilterToFetchMessages(
    discussionId: DocId,
    filterBy: DiscussionMessageFilterByInput,
  ): AnyObject {
    let path;
    if (isNotEmpty(filterBy)) {
      if (filterBy.approach === FetchMessagesApproach.OffspringOnly) {
        path = buildHasAncestorsRegex([filterBy.messageId]);
      }
      if (filterBy.approach === FetchMessagesApproach.RepliesOnly) {
        path = buildHasParentRegex(filterBy.messageId);
      }
    }

    const queryFilter = {
      path: path || '',
      discussion: discussionId,
    };

    return queryFilter;
  }

  public async findDiscussionMessages(
    queryFilter: AnyObject,
    clientFilter: ClientFilterInput = {},
  ): Promise<IDiscussionMessage[]> {
    const { offset, limit, filter, orderBy } = normalizeClientFilterForSearch(
      clientFilter,
    );
    const filterWith = mergeQueryFilters(queryFilter, filter);
    return this.model
      .find(filterWith)
      .sort({
        isPinned: OrderByDirection.Desc,
        [orderBy.property]: orderBy.direction,
      })
      .skip(offset)
      .limit(limit);
  }

  public async putVoteForMessage(
    messageId: DocId,
    userId: DocId,
    isPositive: boolean,
  ): Promise<boolean> {
    const message = await this.findOneByIdOrFail(messageId);
    const myPreviousVote = message.votes.find(vote => {
      return vote.user === userId;
    });
    const payload = {
      user: userId,
      isPositive,
    };
    if (!myPreviousVote) {
      await this.model.findByIdAndUpdate(messageId, {
        $inc: { votesBalance: isPositive ? 1 : -1 },
        $addToSet: {
          votes: payload,
        },
      });
    } else {
      if (myPreviousVote.isPositive !== isPositive) {
        await this.model.findByIdAndUpdate(messageId, {
          $inc: { votesBalance: myPreviousVote.isPositive ? -2 : +2 },
        });
        await this.updateChildInArray(
          messageId,
          'votes',
          myPreviousVote.id,
          payload,
        );
      }
    }
    return true;
  }

  public async countVotesForMessage(
    messageId: DocId,
    votesFilter: AnyObject = {},
  ): Promise<number> {
    const query = totalVotesForMessage(messageId, votesFilter);
    const totalVotes = await this.aggregateValue<number>(query);
    return totalVotes || 0;
  }

  public async findMessageVoteOfUser(
    messageId: DocId,
    userId: DocId,
  ): Promise<IMessageVote> {
    const found = await this.findOne({
      _id: messageId,
      'votes.user': userId,
    });
    return found
      ? (found.votes.find(vote => vote.user === userId) as IMessageVote)
      : null;
  }
}
