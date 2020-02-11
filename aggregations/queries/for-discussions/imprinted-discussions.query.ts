import { ObjectId } from 'bson';
import { AggregationQuery } from '~/commons/typings/mongodb.typings';
import { DocId } from '~/commons/typings/typescript';
import { plural } from 'pluralize';
import { discussionModelName } from '~/discussions-v2/discussions.namings';

export function imprintedDiscussionsQuery(
  discussionId: DocId,
): AggregationQuery {
  discussionId = new ObjectId(discussionId);

  return [
    {
      $match: {
        _id: discussionId,
      },
    },
    {
      $group: {
        _id: null,
        currentDiscussion: {
          $addToSet: '$$CURRENT',
        },
      },
    },
    {
      $lookup: {
        from: plural(discussionModelName),
        localField: 'currentDiscussion.imprint',
        foreignField: 'imprint',
        as: 'imprintedDiscussions',
      },
    },
    {
      $project: {
        _id: false,
      },
    },
    {
      $addFields: {
        imprintedDiscussionsIds: {
          $map: {
            input: '$imprintedDiscussions',
            as: 'discussion',
            in: '$$discussion._id',
          },
        },
      },
    },
  ];
}
