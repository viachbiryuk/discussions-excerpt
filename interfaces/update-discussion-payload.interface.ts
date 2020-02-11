import { TranslationsInput } from '~/commons/graphql/types-and-inputs/translations.input';

export interface IUpdateDiscussionPayload {
  title: TranslationsInput;
  description: TranslationsInput;
}
