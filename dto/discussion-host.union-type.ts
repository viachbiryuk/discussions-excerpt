import { createUnionType } from 'type-graphql';
import { Section } from '~/programs/modules/sections/dto/section.type';
import { Group } from '~/programs/groups/dto/group.type';

export const DiscussionHostUnion = createUnionType({
  name: 'DiscussionHostUnion',
  types: [Section, Group],
});
