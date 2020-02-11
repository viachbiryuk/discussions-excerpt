import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AbstractService } from '~/commons/abstract/abstract.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { discussionModelName } from '~/discussions-v2/discussions.namings';
import { DiscussionMessageInput } from '~/discussions-v2/dto/discussion-message.input';
import { IUser } from '~/users/interfaces/user.interface';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { UserRole } from '~/users/user-role';
import { IProfile } from '~/users/profiles/profile.interface';
import { GroupsService } from '~/programs/groups/services/groups.service';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { RewardsService } from '~/rewards/services/rewards.service';
import { ProgramsService } from '~/programs/services/programs.service';
import { rebuildPath } from '~/commons/utils/materialized-path.utils';
import { DocId } from '~/commons/typings/typescript';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';
import { DiscussionForGroupsInput } from '~/discussions-v2/dto/discussion-for-groups.input';
import { SubscriptionName } from '~/notifications/platform-notifications/subscription-name';
import { Subscriptions } from '~/commons/subscriptions';
import { ModuleSectionType } from '~/programs/modules/sections/module-section-type';
import { ModulesService } from '~/programs/modules/services/modules.service';
import { IProgramAndUserRelationsBySection } from '~/programs/modules/aggregations/interfaces/program-and-user-relations-by-section.interface';
import { UpdateDiscussionForGroupsInput } from '~/discussions-v2/dto/update-discussion-for-groups.input';
import { imprintedDiscussionsQuery } from '~/discussions-v2/aggregations/queries/for-discussions/imprinted-discussions.query';
import { IImprintedDiscussions } from '~/discussions-v2/aggregations/interfaces/imprinted-discussions.interface';
import { IUpdateDiscussionPayload } from '~/discussions-v2/interfaces/update-discussion-payload.interface';
import { imprintedGroupDiscussionsAndUserRelationsQuery } from '~/discussions-v2/aggregations/queries/for-discussions/imprinted-group-discussions-and-user-relations.query';
import { IImprintedGroupDiscussionsAndUserRelations } from '~/discussions-v2/aggregations/interfaces/imprinted-group-discussions-and-user-relations.interface';
import {
  concatIds,
  deepAssureObjectIdForArray,
  getIdsFromEntities,
  idsDifference,
  idsMatch,
} from '~/commons/utils/ids.utils';
import { latestDiscussionsInGroupsQuery } from '~/programs/groups/aggregations/queries/for-groups/latest-discussions-in-groups.query';
import { buildMonoTranslationObject } from '~/commons/utils/language.utils';
import { missingLessonContentDiscussionsQuery } from '~/programs/aggregations/queries/missing-lesson-content-discussions.query';
import { IMissingLessonContentDiscussions } from '~/programs/aggregations/interfaces/missing-lesson-content-discussions.interface';
import { IContentDiscussionPayload } from '~/discussions-v2/interfaces/content-discussion-payload.interface';
import { EffortName } from '~/rewards/types/effort-name.enum';
import { IProgramWeek } from '~/programs/interfaces/program-week.interface';
import { discussionsFromTutoredGroupsQuery } from '~/programs/groups/aggregations/queries/for-groups/discussions-from-tutored-groups.query';
import { discussionsIdsByGroupsIdsQuery } from '~/discussions-v2/aggregations/queries/for-discussions/discussions-ids-by-groups-ids.query';
import { ICreateDiscussionPayload } from '~/discussions-v2/interfaces/create-discussion-payload.interface';
import { genImprint } from '~/commons/utils/data.utils';

@Injectable()
export class DiscussionsService extends AbstractService<IDiscussion> {
  constructor(
    private readonly model: Model<IDiscussion>,
    private readonly groupsService: GroupsService,
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly rewardsService: RewardsService,
    private readonly programsService: ProgramsService,
    private readonly modulesService: ModulesService,
    private readonly subscriptions: Subscriptions,
  ) {
    super(model);
  }

  public async createMissingContentDiscussionsForProgram(
    programId: DocId,
  ): Promise<number> {
    const missing = await this.getMissingLessonContentDiscussions(programId);

    if (missing.program.isPublished === false) {
      const message = `Content Discussions can be created only for published Programs!`;
      throw new BadRequestException(message);
    }

    if (
      !missing ||
      missing.idsOfSectionsThatCanHaveContentDiscussions.length === 0
    ) {
      return 0;
    }
    const payloads = this.buildContentDiscussionPayloads(
      missing.idsOfSectionsThatCanHaveContentDiscussions,
    );
    const created = await this.insertMany(payloads);
    return created.length;
  }

  public buildContentDiscussionPayloads(
    sectionsIdsWithoutContentDiscussions: DocId[],
  ): IContentDiscussionPayload[] {
    return sectionsIdsWithoutContentDiscussions.map(sectionId => {
      return {
        type: DiscussionType.LessonContentDiscussion,
        host: sectionId,
      };
    });
  }

  public getMissingLessonContentDiscussions(
    programId: DocId,
  ): Promise<IMissingLessonContentDiscussions> {
    const query = missingLessonContentDiscussionsQuery(programId);
    return this.programsService.aggregateOne<IMissingLessonContentDiscussions>(
      query,
    );
  }


  public async replyToDiscussionMessage(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const parentMessage = await this.discussionMessagesService.findOneByIdOrFail(
      parentId,
    );
    const discussion = await this.findOneByIdOrFail(parentMessage.discussion);

    if (discussion.type === DiscussionType.GroupIntroductions) {
      return this.replyToMessageInGroupIntroductionsDiscussion(
        parentId,
        message,
        currentUser,
        discussion,
      );
    }
    if (discussion.type === DiscussionType.GroupTopicDiscussion) {
      return this.replyToMessageInGroupTopicDiscussion(
        parentId,
        message,
        currentUser,
        discussion,
      );
    }
    if (discussion.type === DiscussionType.LessonSubjectDiscussion) {
      return this.replyToMessageInLessonSubjectDiscussion(
        parentId,
        message,
        currentUser,
        discussion,
      );
    }
    if (discussion.type === DiscussionType.LessonContentDiscussion) {
      return this.replyToMessageInLessonContentDiscussion(
        parentId,
        message,
        currentUser,
        discussion,
      );
    }
    if (discussion.type === DiscussionType.GroupBroadcasts) {
      return this.replyToMessageInGroupBroadcastsDiscussion(
        parentId,
        message,
        currentUser,
        discussion,
      );
    }

    throw new NotImplementedException();
  }

  public async replyToMessageInGroupIntroductionsDiscussion(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
    discussion: IDiscussion,
  ) {
    return this.commonReplyToAnyMessage(
      parentId,
      message,
      currentUser,
      discussion,
    );
  }

  public async replyToMessageInGroupTopicDiscussion(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
    discussion: IDiscussion,
  ) {
    const group = await this.groupsService.findOneByIdOrFail(discussion.host);
    const createdMessage = await this.commonReplyToAnyMessage(
      parentId,
      message,
      currentUser,
      discussion,
    );

    await this.rewardUserForMessageReplyInDiscussionIfPossible(
      group.program,
      currentUser.id,
    );

    return createdMessage;
  }

  public async replyToMessageInGroupBroadcastsDiscussion(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
    discussion: IDiscussion,
  ) {
    return this.commonReplyToAnyMessage(
      parentId,
      message,
      currentUser,
      discussion,
    );
  }

  public async replyToMessageInLessonSubjectDiscussion(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
    discussion: IDiscussion,
  ) {
    const relations = await this.modulesService.getProgramAndUserRelationBySection(
      discussion.host,
      currentUser.id,
    );

    this.throwIfLessonTypeIsNotSupportedBySubjectDiscussion(
      relations.currentSection.type,
    );

    return this.commonReplyToAnyMessage(
      parentId,
      message,
      currentUser,
      discussion,
    );
  }

  public async replyToMessageInLessonContentDiscussion(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
    discussion: IDiscussion,
  ) {
    const relations = await this.modulesService.getProgramAndUserRelationBySection(
      discussion.host,
      currentUser.id,
    );

    this.throwIfLessonTypeIsNotSupportedByContentDiscussion(
      relations.currentSection.type,
    );

    return this.commonReplyToAnyMessage(
      parentId,
      message,
      currentUser,
      discussion,
    );
  }

  private async commonReplyToAnyMessage(
    parentId: string,
    message: DiscussionMessageInput,
    currentUser: IUser,
    discussion: IDiscussion,
  ) {
    const parentMessage = await this.discussionMessagesService.findOneByIdOrFail(
      parentId,
    );
    if (message.isPinned && currentUser.role !== UserRole.Tutor) {
      message.isPinned = false;
    }

    const messagePath = rebuildPath(parentMessage.path, parentMessage.id);
    const payload = Object.assign(message, {
      path: messagePath,
      user: currentUser.id,
      discussion: parentMessage.discussion,
    });

    const createdMessage = await this.discussionMessagesService.insertOne(
      payload,
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessageCreateInDiscussion,
      Object.assign(createdMessage, {
        raisedBy: currentUser.id,
      }),
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessageReplyInDiscussions,
      Object.assign(createdMessage, {
        toUser: parentMessage.user,
      }),
    );

    const userName = (currentUser.profile as IProfile).fullName;
    await this.groupsService.notifyUserAboutNewMessageReply(
      parentMessage.user,
      userName,
      createdMessage.id,
    );

    return createdMessage;
  }

  public async addMessageToDiscussion(
    discussionId: DocId,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const discussion = await this.findOneByIdOrFail(discussionId);

    if (discussion.type === DiscussionType.GroupBroadcasts) {
      const errorMessage = `Use broadcastDiscussionMessageToGroups mutation to broadcast message!`;
      throw new BadRequestException(errorMessage);
    }

    if (discussion.type === DiscussionType.GroupIntroductions) {
      return this.addMessageToGroupIntroductionsDiscussion(
        discussion,
        message,
        currentUser,
      );
    }
    if (discussion.type === DiscussionType.GroupTopicDiscussion) {
      return this.addMessageToGroupTopicDiscussion(
        discussion,
        message,
        currentUser,
      );
    }
    if (discussion.type === DiscussionType.LessonSubjectDiscussion) {
      return this.addMessageToLessonSubjectDiscussion(
        discussion,
        message,
        currentUser,
      );
    }
    if (discussion.type === DiscussionType.LessonContentDiscussion) {
      return this.addMessageToLessonContentDiscussion(
        discussion,
        message,
        currentUser,
      );
    }
    throw new NotImplementedException();
  }

  public async addMessageToLessonContentDiscussion(
    discussion: IDiscussion,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const relations = await this.modulesService.getProgramAndUserRelationBySection(
      discussion.host,
      currentUser.id,
    );
    this.throwIfLessonTypeIsNotSupportedByContentDiscussion(
      relations.currentSection.type,
    );

    return this.commonAddMessageToAbstractDiscussion(
      discussion,
      message,
      currentUser,
    );
  }

  public async addMessageToLessonSubjectDiscussion(
    discussion: IDiscussion,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const relations = await this.modulesService.getProgramAndUserRelationBySection(
      discussion.host,
      currentUser.id,
    );
    this.throwIfLessonTypeIsNotSupportedBySubjectDiscussion(
      relations.currentSection.type,
    );

    return this.commonAddMessageToAbstractDiscussion(
      discussion,
      message,
      currentUser,
    );
  }

  public async addMessageToGroupIntroductionsDiscussion(
    discussion: IDiscussion,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const group = await this.groupsService.findOneByIdOrFail(discussion.host);
    const createdMessage = await this.commonAddMessageToAbstractDiscussion(
      discussion,
      message,
      currentUser,
    );

    const usersIdsToNotify = concatIds(group.learners, [group.tutor]);
    await this.groupsService.notifyUsersAboutNewPostInGroup(
      usersIdsToNotify,
      createdMessage.id,
    );

    await this.rewardUserForGroupIntroductionMessageIfPossible(
      group.program,
      discussion.id,
      currentUser.id,
    );

    return createdMessage;
  }

  public async addMessageToGroupTopicDiscussion(
    discussion: IDiscussion,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    const group = await this.groupsService.findOneByIdOrFail(discussion.host);
    const createdMessage = await this.commonAddMessageToAbstractDiscussion(
      discussion,
      message,
      currentUser,
    );

    const usersIdsToNotify = concatIds(group.learners, [group.tutor]);
    await this.groupsService.notifyUsersAboutNewPostInGroup(
      usersIdsToNotify,
      createdMessage.id,
    );

    await this.rewardUserForNewMessageInTopicDiscussionIfPossible(
      group.program,
      currentUser.id,
    );

    return createdMessage;
  }

  public async commonAddMessageToAbstractDiscussion(
    discussion: IDiscussion,
    message: DiscussionMessageInput,
    currentUser: IUser,
  ): Promise<IDiscussionMessage> {
    if (message.isPinned && currentUser.role !== UserRole.Tutor) {
      message.isPinned = false;
    }

    const payload = Object.assign(message, {
      user: currentUser.id,
      discussion: discussion.id,
    });

    const createdMessage = await this.discussionMessagesService.insertOne(
      payload,
    );

    await this.subscriptions.publish(
      SubscriptionName.onMessageCreateInDiscussion,
      Object.assign(createdMessage, {
        raisedBy: currentUser.id,
      }),
    );

    return createdMessage;
  }

  public async createTopicDiscussionForGroups(
    discussion: DiscussionForGroupsInput,
    userId: DocId,
  ): Promise<IDiscussion> {
    const tutoredGroupsIds = await this.groupsService.getIdsOfTutoredGroups(
      userId,
    );

    if (discussion.bindToWeek) {
      const week = await this.programsService.getWeekByWeekId(
        discussion.bindToWeek,
      );
      if (week === null) {
        const message = `Week ${discussion.bindToWeek} not found!`;
        throw new NotFoundException(message);
      }
    }

    const triesToCreateDiscussionsInGroupsIds = concatIds(
      discussion.alsoInGroups,
      [discussion.inGroup],
    );
    const triesToCreateDiscussionsInNonTutoredGroupsIds = idsDifference(
      triesToCreateDiscussionsInGroupsIds,
      tutoredGroupsIds,
    );

    if (triesToCreateDiscussionsInNonTutoredGroupsIds.length > 0) {
      const message = `User ${userId} is not a Tutor in Groups ${triesToCreateDiscussionsInNonTutoredGroupsIds}!`;
      throw new ForbiddenException(message);
    }

    await this.markAllDiscussionsAsInactiveForGroups(
      triesToCreateDiscussionsInGroupsIds,
    );

    const payloads = this.buildCreateDiscussionPayloads(
      discussion,
      DiscussionType.GroupTopicDiscussion,
    );
    const createdDiscussions = await this.insertMany(payloads);

    createdDiscussions.map(createdDiscussion => {
      return this.subscriptions.publish(
        SubscriptionName.onDiscussionCreateInGroup,
        Object.assign(createdDiscussion, {
          raisedBy: userId,
        }),
      );
    });

    return createdDiscussions.find(createdDiscussion =>
      idsMatch(createdDiscussion.host, discussion.inGroup),
    );
  }

  public async updateTopicDiscussionForGroups(
    discussionId: DocId,
    discussion: UpdateDiscussionForGroupsInput,
    userId: DocId,
  ): Promise<boolean> {
    const foundDiscussion = await this.findOneByIdOrFail(discussionId);
    const relations = await this.getImprintedGroupDiscussionsAndUserRelations(
      discussionId,
      userId,
    );
    const triesToUpdateDiscussionsInGroupsIds = concatIds(
      [foundDiscussion.host],
      discussion.alsoInGroups,
    );
    const triesToUpdateDiscussionIds = await this.getDiscussionsIdsByGroupsIds(
      triesToUpdateDiscussionsInGroupsIds,
      foundDiscussion.imprint,
    );
    const tutoredGroupsIds = await this.groupsService.getIdsOfTutoredGroups(
      userId,
    );

    const triesToUpdateDiscussionsInIrrelevantGroupsIds = idsDifference(
      triesToUpdateDiscussionsInGroupsIds,
      relations.relatedGroupsIds,
    );
    const triesToUpdateDiscussionsInNonTutoredGroupsIds = idsDifference(
      triesToUpdateDiscussionsInGroupsIds,
      tutoredGroupsIds,
    );

    if (triesToUpdateDiscussionsInIrrelevantGroupsIds.length > 0) {
      const message = `Discussion ${discussionId} for Groups ${triesToUpdateDiscussionsInIrrelevantGroupsIds} has different imprint!`;
      throw new UnprocessableEntityException(message);
    }

    if (triesToUpdateDiscussionsInNonTutoredGroupsIds.length > 0) {
      const message = `User ${userId} is not a Tutor in Groups ${triesToUpdateDiscussionsInNonTutoredGroupsIds}!`;
      throw new ForbiddenException(message);
    }

    const payload = this.buildUpdateDiscussionPayload(discussion);

    await this.updateMany(
      {
        _id: {
          $in: triesToUpdateDiscussionIds,
        },
      },
      payload,
    );

    triesToUpdateDiscussionIds.map(updatedDiscussionId => {
      return this.subscriptions.publish(
        SubscriptionName.onDiscussionUpdateInGroup,
        Object.assign(foundDiscussion, payload, {
          raisedBy: userId,
        }),
      );
    });

    return true;
  }

  private buildUpdateDiscussionPayload(
    discussion: UpdateDiscussionForGroupsInput,
  ): IUpdateDiscussionPayload {
    let title;
    let description;

    if (discussion.title) {
      title = buildMonoTranslationObject(discussion.title);
    }
    if (discussion.description) {
      description = buildMonoTranslationObject(discussion.description);
    }
    return {
      title,
      description,
    };
  }

  private buildCreateDiscussionPayloads(
    discussion: DiscussionForGroupsInput,
    discussionType: DiscussionType,
  ): ICreateDiscussionPayload[] {
    const triesToCreateDiscussionsInGroupsIds = concatIds(
      discussion.alsoInGroups,
      [discussion.inGroup],
    );

    const imprint = genImprint();
    return triesToCreateDiscussionsInGroupsIds.map((groupId: DocId) => {
      const payload: ICreateDiscussionPayload = {
        title: buildMonoTranslationObject(discussion.title),
        description: buildMonoTranslationObject(discussion.description),
        type: discussionType,
        host: groupId,
        imprint,
      };

      if (discussion.bindToWeek) {
        payload.bounds = {
          week: discussion.bindToWeek,
        };
      }

      return payload;
    });
  }

  public async insertIntroductionDiscussionForGroups(
    groupsIds: DocId[],
  ): Promise<IDiscussion[]> {
    const payloads = deepAssureObjectIdForArray(groupsIds).map(groupId => {
      return {
        title: buildMonoTranslationObject('Introduce Yourself', true),
        description: buildMonoTranslationObject(
          'Introduce Yourself Question',
          true,
        ),
        type: DiscussionType.GroupIntroductions,
        host: groupId,
      };
    });
    return this.insertMany(payloads);
  }

  private throwIfLessonTypeIsNotSupportedByContentDiscussion(
    lessonType: ModuleSectionType,
  ): void {
    const notSupportedLessonTypes = [
      ModuleSectionType.SubjectDiscussion,
      ModuleSectionType.Quiz,
      ModuleSectionType.QuizAssessment,
    ];
    if (notSupportedLessonTypes.includes(lessonType)) {
      const message = `Lesson type ${lessonType} is not supported by content discussion!`;
      throw new NotImplementedException(message);
    }
  }

  private async throwIfLessonTypeIsNotSupportedBySubjectDiscussion(
    lessonType: ModuleSectionType,
  ): Promise<void> {
    if (lessonType !== ModuleSectionType.SubjectDiscussion) {
      const message = `Lesson type must be ${ModuleSectionType.SubjectDiscussion}!`;
      throw new UnprocessableEntityException(message);
    }
  }

  private async throwIfUserCanNotAddMessageToThisLessonDiscussion(
    relations: IProgramAndUserRelationsBySection,
  ): Promise<IProgramAndUserRelationsBySection> {
    const privilegedUserRoles = [UserRole.Admin, UserRole.Manager];

    if (
      privilegedUserRoles.includes(relations.currentUserRole) ||
      relations.isLearnerInThisProgram ||
      relations.isMentorInThisProgram
    ) {
      return relations;
    }

    const message = `You must be a Learner/Tutor in Program ${relations.program.id} or Admin/Manager to add message to this Discussion!`;
    throw new ForbiddenException(message);
  }

  public async getDiscussionsFromTutoredGroups(
    tutorId: DocId,
  ): Promise<IDiscussion[]> {
    const query = discussionsFromTutoredGroupsQuery(tutorId);
    return this.groupsService.aggregateMany<IDiscussion>(query);
  }

  public async getImprintedDiscussions(
    discussionId: DocId,
  ): Promise<IImprintedDiscussions> {
    const query = imprintedDiscussionsQuery(discussionId);
    return this.aggregateOne<IImprintedDiscussions>(query);
  }

  public async getImprintedGroupDiscussionsAndUserRelations(
    discussionId: DocId,
    userId: DocId,
  ): Promise<IImprintedGroupDiscussionsAndUserRelations> {
    const query = imprintedGroupDiscussionsAndUserRelationsQuery(
      discussionId,
      userId,
    );
    return this.aggregateOne<IImprintedGroupDiscussionsAndUserRelations>(query);
  }

  public async getDiscussionsIdsByGroupsIds(
    groupsIds: DocId[],
    imprint: string,
  ): Promise<DocId[]> {
    const query = discussionsIdsByGroupsIdsQuery(groupsIds, imprint);
    return this.aggregateIds(query);
  }

  public async getLatestDiscussionsIdsForGroups(
    groupsIds: DocId[],
  ): Promise<DocId[]> {
    const query = latestDiscussionsInGroupsQuery(groupsIds);
    return this.groupsService.aggregateIds(query);
  }


}
