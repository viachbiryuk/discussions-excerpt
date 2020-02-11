import { Resolver, Parent, ResolveProperty } from '@nestjs/graphql';
import { DiscussionBounds } from '~/discussions-v2/dto/discussion-bounds.type';
import { ProgramsService } from '~/programs/services/programs.service';
import { IProgramWeek } from '~/programs/interfaces/program-week.interface';
import { ProgramWeek } from '~/programs/dto/program-week.type';
import { isEmpty } from 'lodash';
import { IDiscussionBounds } from '~/discussions-v2/models/interfaces/discussion-bounds.interface';

@Resolver(of => DiscussionBounds)
export class DiscussionBoundsPropertyResolver {
  constructor(private readonly programsService: ProgramsService) {}

  @ResolveProperty(returns => ProgramWeek)
  public async week(
    @Parent() discussionBounds: IDiscussionBounds,
  ): Promise<IProgramWeek> {
    if (isEmpty(discussionBounds) || !discussionBounds.week) {
      return null;
    }
    return this.programsService.getWeekByWeekId(discussionBounds.week);
  }
}
