import { Resolver, Parent, ResolveProperty } from '@nestjs/graphql';
import { User } from '~/users/user.type';
import { UsersService } from '~/users/services/users.service';
import { IUser } from '~/users/interfaces/user.interface';
import { IMessageVote } from '~/discussions-v2/models/interfaces/message-vote.interface';
import { MessageVote } from '~/discussions-v2/dto/message-vote.type';

@Resolver(of => MessageVote)
export class MessageVotePropertyResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveProperty(returns => User)
  public async user(@Parent() vote: IMessageVote): Promise<IUser> {
    return this.usersService.findOneByIdOrFail(vote.user as string);
  }
}
