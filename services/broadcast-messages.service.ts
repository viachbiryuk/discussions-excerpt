import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUser } from '~/users/interfaces/user.interface';
import { GroupsService } from '~/programs/groups/services/groups.service';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { DocId } from '~/commons/typings/typescript';
import { Subscriptions } from '~/commons/subscriptions';
import { DiscussionMessageInput } from '~/discussions-v2/dto/discussion-message.input';
import { UserRole } from '~/users/user-role';
import { DiscussionsService } from '~/discussions-v2/services/discussions.service';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';
import { getIdsFromEntities, hasId } from '~/commons/utils/ids.utils';
import { SubscriptionName } from '~/notifications/platform-notifications/subscription-name';
import { IProvidedBroadcastDiscussions } from '~/discussions-v2/interfaces/provided-broadcast-discussions.interface';
import { genImprint } from '~/commons/utils/data.utils';

@Injectable()
export class BroadcastMessagesService {
  constructor(
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly discussionsService: DiscussionsService,
    private readonly subscriptions: Subscriptions,
  ) {}

  public async getGroupsIdsWithoutBroadcasts(
    groupsIds: DocId[],
  ): Promise<DocId[]> {
    const groupsIdsWithBroadcasts = await this.getGroupsIdsWithBroadcasts(
      groupsIds,
    );
    return groupsIds.filter(groupId => {
      return !hasId(groupsIdsWithBroadcasts, groupId);
    });
  }

  public async broadcastMessageToGroups(
    message: DiscussionMessageInput,
    groupsIds: DocId[],
    currentUser: IUser,
  ): Promise<boolean> {
    const relations = await this.groupsService.getTutorAndGroupsRelations(
      currentUser.id,
      groupsIds,
    );
    if (currentUser.role === UserRole.Tutor && !relations.isTutorInAllGroups) {
      const errorMessage = `User is not a Tutor in Groups: ${relations.notTutorInGroupsIds}!`;
      throw new ForbiddenException(errorMessage);
    }
    if (relations.notFoundGroupsIds.length > 0) {
      const errorMessage = `Groups are not found: ${relations.notFoundGroupsIds}!`;
      throw new NotFoundException(errorMessage);
    }

    const groupIdsWithoutBroadcasts = await this.getGroupsIdsWithoutBroadcasts(
      groupsIds,
    );
    const {
      discussionsIds,
      createdDiscussions,
    } = await this.provideDiscussionsIdsForBroadcastsInGroups(
      groupsIds,
      groupIdsWithoutBroadcasts,
    );

    const imprint = genImprint();
    const payloads = discussionsIds.map(discussionId => {
      return {
        discussion: discussionId,
        user: currentUser.id,
        isBroadcast: true,
        imprint,
        text: message.text,
        isPinned: message.isPinned,
      };
    });

    const createdMessages = await this.discussionMessagesService.insertMany(
      payloads,
    );

    createdDiscussions.map(createdDiscussion => {
      return this.subscriptions.publish(
        SubscriptionName.onDiscussionCreateInGroup,
        Object.assign(createdDiscussion, {
          raisedBy: currentUser.id,
        }),
      );
    });

    createdMessages.map(createdMessage => {
      return this.subscriptions.publish(
        SubscriptionName.onMessageCreateInDiscussion,
        Object.assign(createdMessage, {
          raisedBy: currentUser.id,
        }),
      );
    });

    return true;
  }

  public async getGroupsIdsWithBroadcasts(
    groupsIds: DocId[],
  ): Promise<DocId[]> {
    const broadcastDiscussions = await this.discussionsService.findMany({
      type: DiscussionType.GroupBroadcasts,
      host: {
        $in: groupsIds,
      },
    });
    return broadcastDiscussions.map(discussion => discussion.host);
  }

  public async getBroadcastDiscussionIdsByGroupsIds(
    groupsIds: DocId[],
  ): Promise<DocId[]> {
    const groupsWithBroadcasts = await this.discussionsService.findMany({
      type: DiscussionType.GroupBroadcasts,
      host: {
        $in: groupsIds,
      },
    });
    return getIdsFromEntities(groupsWithBroadcasts);
  }

  public async provideDiscussionsIdsForBroadcastsInGroups(
    groupsIds: DocId[],
    groupIdsWithoutDiscussion: DocId[],
  ): Promise<IProvidedBroadcastDiscussions> {
    const payloads = groupIdsWithoutDiscussion.map(groupId => {
      return {
        type: DiscussionType.GroupBroadcasts,
        host: groupId,
      };
    });
    const createdDiscussions = await this.discussionsService.insertMany(
      payloads,
    );
    const discussionsIds = await this.getBroadcastDiscussionIdsByGroupsIds(
      groupsIds,
    );
    return {
      createdDiscussions: createdDiscussions || [],
      discussionsIds,
    };
  }
}
