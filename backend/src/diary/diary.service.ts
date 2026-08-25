import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DailyPrompt, Diary } from '@prisma/client';
import { GroupService } from '../group/group.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupService: GroupService,
  ) {}

  async createDiary(authorId: string, dto: CreateDiaryDto): Promise<Diary> {
    const groupIds = dto.privacyScope === 'group' ? (dto.groupIds ?? []) : [];
    if (dto.privacyScope === 'group' && groupIds.length === 0) {
      throw new BadRequestException(
        'group 공개 범위에는 최소 1개의 그룹을 지정해야 합니다.',
      );
    }

    for (const groupId of groupIds) {
      const isMember = await this.groupService.isMember(groupId, authorId);
      if (!isMember) {
        throw new ForbiddenException(
          '본인이 속하지 않은 그룹에는 공유할 수 없습니다.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const diary = await tx.diary.create({
        data: {
          authorId,
          entryType: dto.entryType,
          content: dto.content,
          emoji: dto.emoji,
          privacyScope: dto.privacyScope,
          promptId: dto.promptId,
        },
      });

      if (groupIds.length > 0) {
        await tx.diaryGroupShare.createMany({
          data: groupIds.map((groupId) => ({ diaryId: diary.id, groupId })),
        });
      }

      return diary;
    });
  }

  listMyDiaries(authorId: string): Promise<Diary[]> {
    return this.prisma.diary.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDiary(userId: string, diaryId: string): Promise<Diary> {
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
      include: { groupShares: true },
    });
    if (!diary) {
      throw new NotFoundException('일기를 찾을 수 없습니다.');
    }

    if (diary.authorId === userId || diary.privacyScope === 'public') {
      return diary;
    }

    if (diary.privacyScope === 'group') {
      for (const share of diary.groupShares) {
        if (await this.groupService.isMember(share.groupId, userId)) {
          return diary;
        }
      }
    }

    throw new ForbiddenException('해당 일기를 볼 수 없습니다.');
  }

  async updateDiary(
    userId: string,
    diaryId: string,
    dto: UpdateDiaryDto,
  ): Promise<Diary> {
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('일기를 찾을 수 없습니다.');
    }
    if (diary.authorId !== userId) {
      throw new ForbiddenException('본인이 작성한 일기만 수정할 수 있습니다.');
    }

    return this.prisma.diary.update({
      where: { id: diaryId },
      data: {
        content: dto.content,
        emoji: dto.emoji,
        privacyScope: dto.privacyScope,
      },
    });
  }

  async deleteDiary(userId: string, diaryId: string): Promise<void> {
    const diary = await this.prisma.diary.findUnique({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('일기를 찾을 수 없습니다.');
    }
    if (diary.authorId !== userId) {
      throw new ForbiddenException('본인이 작성한 일기만 삭제할 수 있습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.diaryGroupShare.deleteMany({ where: { diaryId } }),
      this.prisma.diary.delete({ where: { id: diaryId } }),
    ]);
  }

  async getTodayPrompt(): Promise<DailyPrompt> {
    const prompt = await this.prisma.dailyPrompt.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (!prompt) {
      throw new NotFoundException('등록된 프롬프트가 없습니다.');
    }
    return prompt;
  }
}
