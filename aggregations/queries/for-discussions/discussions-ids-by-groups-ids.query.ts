import { AggregationQuery } from '~/commons/typings/mongodb.typings';
import { DocId } from '~/commons/typings/typescript';
import { deepAssureObjectIdForArray } from '~/commons/utils/ids.utils';

export function discussionsIdsByGroupsIdsQuery(
  groupsIds: DocId[],
  imprint: string,
): AggregationQuery {
  groupsIds = deepAssureObjectIdForArray(groupsIds);

  return [
    {
      $match: {
        imprint,
        host: {
          $in: groupsIds,
        },
      },
    },
    {
      $group: {
        _id: null,
        discussions: {
          $addToSet: '$$CURRENT',
        },
      },
    },
    {
      $addFields: {
        ids: {
          $map: {
            input: '$discussions',
            as: 'discussion',
            in: '$$discussion._id',
          },
        },
      },
    },
  ];
}
