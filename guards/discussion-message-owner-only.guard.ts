import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  getArgFromContext,
  getSessionFromRequestContext,
} from '~/commons/utils/context.utils';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { IUser } from '~/users/interfaces/user.interface';
import { messageIdArgName } from '~/commons/graphql/arg-namings';
import { idsMatch } from '~/commons/utils/ids.utils';

@Injectable()
export class DiscussionMessageOwnerOnlyGuard implements CanActivate {
  constructor(
    private readonly discussionMessagesService: DiscussionMessagesService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const messageId = getArgFromContext(context, messageIdArgName);
    const session = getSessionFromRequestContext(context);
    const message = await this.discussionMessagesService.findOneByIdOrFail(
      messageId,
    );

    if (!idsMatch((session.user as IUser).id, message.user)) {
      const errorMessage = 'Only the owner can  update a discussion message!';
      throw new UnprocessableEntityException(errorMessage);
    }

    return true;
  }
}
