import { AggregationQuery } from '~/commons/typings/mongodb.typings';
import { AnyObject, DocId } from '~/commons/typings/typescript';
import { ObjectId } from 'bson';

export function totalVotesForMessage(
  messageId: DocId,
  votesFilter: AnyObject = {},
): AggregationQuery {
  messageId = new ObjectId(messageId);

  const matchFilter = Object.keys(votesFilter)
    .map((key: string) => {
      return { ['votes.' + key]: votesFilter[key] };
    })
    .reduce((accumulator, currentValue) => {
      return Object.assign(accumulator, currentValue);
    }, {});

  return [
    {
      $match: {
        _id: messageId,
      },
    },
    {
      $unwind: '$votes',
    },
    {
      $match: matchFilter,
    },
    {
      $group: {
        _id: null,
        result: { $sum: 1 },
      },
    },
  ];
}
