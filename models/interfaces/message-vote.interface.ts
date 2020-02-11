import { Document } from 'mongoose';
import { IUser } from '~/users/interfaces/user.interface';

export interface IMessageVote extends Document {
  isPositive: boolean;
  user: DocId | IUser;
}
