import { Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '~/auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '~/auth/param-decorators/current-user.decorator';
import { IUser } from '~/users/interfaces/user.interface';
import { RolesGuard } from '~/auth/guards/roles.guard';
import { ReqArg } from '~/commons/graphql/shortcut-decorators';
import { ID } from 'type-graphql';
import { BroadcastMessagesService } from '~/discussions-v2/services/broadcast-messages.service';
import { DiscussionMessageInput } from '~/discussions-v2/dto/discussion-message.input';
import { UserRole } from '~/users/user-role';
import { ForRoles } from '~/auth/for-roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Resolver()
export class BroadcastMessagesResolver {
  constructor(
    private readonly broadcastMessagesService: BroadcastMessagesService,
  ) {}

  @ForRoles(UserRole.Tutor, UserRole.Manager)
  @Mutation(returns => Boolean)
  public async broadcastMessageToGroups(
    @ReqArg('message', DiscussionMessageInput) message: DiscussionMessageInput,
    @ReqArg('toGroups', [ID]) groupsIds: string[],
    @CurrentUser() currentUser: IUser,
  ): Promise<boolean> {
    return this.broadcastMessagesService.broadcastMessageToGroups(
      message,
      groupsIds,
      currentUser,
    );
  }
}
