import { Parent, ResolveProperty, Resolver } from '@nestjs/graphql';
import { CurrentLanguage } from '~/auth/param-decorators/current-language.decorator';
import { SupportedLanguage } from '~/dictionaries/languages/supported-language';
import { Discussion } from '~/discussions-v2/dto/discussion.type';
import { IDiscussion } from '~/discussions-v2/models/interfaces/discussion.interface';
import { translateProperty } from '~/commons/utils/language.utils';
import { DiscussionMessage } from '~/discussions-v2/dto/discussion-message.type';
import { IDiscussionMessage } from '~/discussions-v2/models/interfaces/discussion-message.interface';
import { DiscussionMessagesService } from '~/discussions-v2/services/discussion-messages.service';
import { ClientFilterInput } from '~/commons/graphql/types-and-inputs/client-filter.input';
import { Int } from 'type-graphql';
import { ClientFilterArg } from '~/commons/graphql/shortcut-decorators';
import { DiscussionHostUnion } from '~/discussions-v2/dto/discussion-host.union-type';
import { plainToClass } from 'class-transformer';
import { DiscussionType } from '~/discussions-v2/enums/discussion-type.enum';
import { GroupsService } from '~/programs/groups/services/groups.service';
import { Group } from '~/programs/groups/dto/group.type';
import { Section } from '~/programs/modules/sections/dto/section.type';
import { forwardRef, Inject } from '@nestjs/common';
import { ModulesService } from '~/programs/modules/services/modules.service';

@Resolver(of => Discussion)
export class DiscussionPropertyResolver {
  constructor(
    private readonly discussionMessagesService: DiscussionMessagesService,
    private readonly groupsService: GroupsService,
    private readonly modulesService: ModulesService,
  ) {}

  @ResolveProperty(returns => DiscussionHostUnion)
  public async host(
    @Parent() discussion: IDiscussion,
    @CurrentLanguage() language: SupportedLanguage,
  ): Promise<Group | Section> {
    const isHostedByGroup = [
      DiscussionType.GroupBroadcasts,
      DiscussionType.GroupTopicDiscussion,
      DiscussionType.GroupIntroductions,
    ].includes(discussion.type);

    if (isHostedByGroup) {
      const group = await this.groupsService.findOneByIdOrFail(discussion.host);
      return plainToClass(Group, group.toObject({ virtuals: true }));
    }

    const section = await this.modulesService.findSectionById(discussion.host);
    return plainToClass(Section, section.toObject({ virtuals: true }));
  }

  @ResolveProperty(returns => String)
  public async title(
    @Parent() discussion: IDiscussion,
    @CurrentLanguage() language: SupportedLanguage,
  ): Promise<string> {
    return translateProperty(discussion.title, language);
  }

  @ResolveProperty(returns => String)
  public async description(
    @Parent() discussion: IDiscussion,
    @CurrentLanguage() language: SupportedLanguage,
  ): Promise<string> {
    return translateProperty(discussion.description, language);
  }

  @ResolveProperty(returns => [DiscussionMessage])
  public async messages(
    @Parent() discussion: IDiscussion,
    @ClientFilterArg() clientFilter: ClientFilterInput,
  ): Promise<IDiscussionMessage[]> {
    return this.discussionMessagesService.findDiscussionMessages(
      {
        path: '',
        discussion: discussion.id,
      },
      clientFilter,
    );
  }

  @ResolveProperty(returns => Int)
  public async countMessages(
    @Parent() discussion: IDiscussion,
    @ClientFilterArg() clientFilter: ClientFilterInput,
  ): Promise<number> {
    return this.discussionMessagesService.count(
      {
        discussion: discussion.id,
      },
      clientFilter,
    );
  }
}
