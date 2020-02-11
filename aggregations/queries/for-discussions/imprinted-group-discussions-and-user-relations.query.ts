import { AggregationQuery } from '~/commons/typings/mongodb.typings';
import { DocId } from '~/commons/typings/typescript';
import { plural } from 'pluralize';
import { learnerProgressModelName } from '~/programs/program-progress/learner-progress.model-name';
import { groupModelName } from '~/programs/groups/group.model-name';
import { userModelName } from '~/users/user.model-name';
import { imprintedDiscussionsQuery } from '~/discussions-v2/aggregations/queries/for-discussions/imprinted-discussions.query';

export function imprintedGroupDiscussionsAndUserRelationsQuery(
  discussionId: DocId,
  userId: DocId,
): AggregationQuery {
  const baseQuery = imprintedDiscussionsQuery(discussionId);

  return baseQuery.concat([
    {
      $addFields: {
        relatedGroupsIds: {
          $map: {
            input: '$imprintedDiscussions',
            as: 'discussion',
            in: '$$discussion.host',
          },
        },
      },
    },
    {
      $unwind: '$imprintedDiscussions',
    },
    {
      $lookup: {
        from: plural(groupModelName),
        localField: 'imprintedDiscussions.host',
        foreignField: '_id',
        as: 'hostedInGroup',
      },
    },
    {
      $addFields: {
        hostedInGroup: {
          $arrayElemAt: ['$hostedInGroup', 0],
        },
      },
    },
    {
      $addFields: {
        discussionsToGroupsMap: {
          groupId: '$imprintedDiscussions.host',
          discussionId: '$imprintedDiscussions._id',
          isTutorInGroupDiscussion: {
            $eq: ['$hostedInGroup.tutor', userId.toString()],
          },
        },
      },
    },
    {
      $group: {
        _id: {
          currentDiscussion: {
            $arrayElemAt: ['$currentDiscussion', 0],
          },
          imprintedDiscussionsIds: '$imprintedDiscussionsIds',
          relatedGroupsIds: '$relatedGroupsIds',
        },
        discussionsToGroupsMap: {
          $push: '$discussionsToGroupsMap',
        },
        imprintedDiscussions: {
          $push: '$imprintedDiscussions',
        },
      },
    },
    {
      $project: {
        _id: false,
        currentDiscussion: '$_id.currentDiscussion',
        imprintedDiscussionsIds: '$_id.imprintedDiscussionsIds',
        relatedGroupsIds: '$_id.relatedGroupsIds',
        discussionsToGroupsMap: '$discussionsToGroupsMap',
        imprintedDiscussions: '$imprintedDiscussions',
      },
    },
    {
      $addFields: {
        totalGroupDiscussions: {
          $size: '$discussionsToGroupsMap',
        },
        tutorInGroupDiscussions: {
          $reduce: {
            input: '$discussionsToGroupsMap',
            initialValue: [],
            in: {
              $cond: {
                if: {
                  $eq: ['$$this.isTutorInGroupDiscussion', false],
                },
                then: {
                  $concatArrays: [['$$this.discussionId'], '$$value'],
                },
                else: '$$value',
              },
            },
          },
        },
        notTutorInGroupDiscussions: {
          $reduce: {
            input: '$discussionsToGroupsMap',
            initialValue: [],
            in: {
              $cond: {
                if: {
                  $eq: ['$$this.isTutorInGroupDiscussion', true],
                },
                then: {
                  $concatArrays: [['$$this.discussionId'], '$$value'],
                },
                else: '$$value',
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        isTutorInAllImprintedDiscussions: {
          $eq: [
            '$totalGroupDiscussions',
            {
              $size: '$tutorInGroupDiscussions',
            },
          ],
        },
      },
    },
  ]);
}
