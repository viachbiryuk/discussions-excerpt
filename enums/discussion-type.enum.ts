import { registerEnumType } from 'type-graphql';

export enum DiscussionType {
  LessonSubjectDiscussion = 'LessonSubjectDiscussion',
  LessonContentDiscussion = 'LessonContentDiscussion',
  GroupTopicDiscussion = 'GroupTopicDiscussion',
  GroupBroadcasts = 'GroupBroadcasts',
  GroupIntroductions = 'GroupIntroductions',
}

registerEnumType(DiscussionType, {
  name: 'DiscussionType',
  description: 'Type of Discussion',
});
