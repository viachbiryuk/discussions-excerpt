import { Resolver, Parent, ResolveProperty } from '@nestjs/graphql';
import { DocId } from '~/commons/typings/typescript';
import { ID } from 'type-graphql';
import { IDiscussionRemoveInGroup } from '~/discussions-v2/interfaces/discussion-remove-in-group.interface';
import { RemovedDiscussion } from '~/discussions-v2/dto/removed-discussion.type';


@Resolver(of => RemovedDiscussion)
export class RemovedDiscussionPropertyResolver {
  @ResolveProperty(returns => ID)
  public async discussionId(
    @Parent() removed: IDiscussionRemoveInGroup,
  ): Promise<DocId> {
    return removed.discussion.id;
  }

}
