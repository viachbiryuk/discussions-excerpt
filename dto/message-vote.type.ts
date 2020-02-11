import { ObjectType, Field } from 'type-graphql';
import { User } from '~/users/user.type';
import { IUser } from '~/users/interfaces/user.interface';

@ObjectType()
export class MessageVote {
  @Field()
  public isPositive: boolean;

  @Field(type => User)
  public user: IUser;
}
