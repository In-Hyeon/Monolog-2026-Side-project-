import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupService } from '../group/group.service';
import { PrismaService } from '../prisma/prisma.service';
import { DiaryService } from './diary.service';

describe('DiaryService', () => {
  let service: DiaryService;
  let prisma: {
    diary: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    diaryGroupShare: { createMany: jest.Mock; deleteMany: jest.Mock };
    dailyPrompt: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let groupService: { isMember: jest.Mock };

  beforeEach(() => {
    prisma = {
      diary: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      diaryGroupShare: { createMany: jest.fn(), deleteMany: jest.fn() },
      dailyPrompt: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };
    groupService = { isMember: jest.fn() };
    service = new DiaryService(
      prisma as unknown as PrismaService,
      groupService as unknown as GroupService,
    );
  });

  describe('createDiary', () => {
    it('group 공개인데 groupIds가 없으면 BadRequestException을 던진다', async () => {
      await expect(
        service.createDiary('u1', {
          entryType: 'quick',
          content: '내용',
          privacyScope: 'group',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('속하지 않은 그룹이면 ForbiddenException을 던진다', async () => {
      groupService.isMember.mockResolvedValue(false);

      await expect(
        service.createDiary('u1', {
          entryType: 'quick',
          content: '내용',
          privacyScope: 'group',
          groupIds: ['g1'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('private/public이면 트랜잭션에서 diary만 생성한다', async () => {
      const diary = { id: 'd1' };
      prisma.diary.create.mockResolvedValue(diary);
      prisma.$transaction.mockImplementation(
        (fn: (tx: typeof prisma) => unknown) => fn(prisma),
      );

      await expect(
        service.createDiary('u1', {
          entryType: 'quick',
          content: '내용',
          privacyScope: 'private',
        }),
      ).resolves.toBe(diary);
      expect(prisma.diaryGroupShare.createMany).not.toHaveBeenCalled();
    });

    it('group이고 멤버십이 확인되면 diary와 share를 함께 생성한다', async () => {
      groupService.isMember.mockResolvedValue(true);
      const diary = { id: 'd1' };
      prisma.diary.create.mockResolvedValue(diary);
      prisma.$transaction.mockImplementation(
        (fn: (tx: typeof prisma) => unknown) => fn(prisma),
      );

      await expect(
        service.createDiary('u1', {
          entryType: 'quick',
          content: '내용',
          privacyScope: 'group',
          groupIds: ['g1'],
        }),
      ).resolves.toBe(diary);
      expect(prisma.diaryGroupShare.createMany).toHaveBeenCalledWith({
        data: [{ diaryId: 'd1', groupId: 'g1' }],
      });
    });
  });

  describe('getDiary', () => {
    it('존재하지 않으면 NotFoundException을 던진다', async () => {
      prisma.diary.findUnique.mockResolvedValue(null);

      await expect(service.getDiary('u1', 'd1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('작성자면 볼 수 있다', async () => {
      const diary = {
        id: 'd1',
        authorId: 'u1',
        privacyScope: 'private',
        groupShares: [],
      };
      prisma.diary.findUnique.mockResolvedValue(diary);

      await expect(service.getDiary('u1', 'd1')).resolves.toBe(diary);
    });

    it('public이면 타인도 볼 수 있다', async () => {
      const diary = {
        id: 'd1',
        authorId: 'other',
        privacyScope: 'public',
        groupShares: [],
      };
      prisma.diary.findUnique.mockResolvedValue(diary);

      await expect(service.getDiary('u1', 'd1')).resolves.toBe(diary);
    });

    it('group 공유이고 공유된 그룹 멤버면 볼 수 있다', async () => {
      const diary = {
        id: 'd1',
        authorId: 'other',
        privacyScope: 'group',
        groupShares: [{ groupId: 'g1' }],
      };
      prisma.diary.findUnique.mockResolvedValue(diary);
      groupService.isMember.mockResolvedValue(true);

      await expect(service.getDiary('u1', 'd1')).resolves.toBe(diary);
    });

    it('private이고 작성자가 아니면 ForbiddenException을 던진다', async () => {
      const diary = {
        id: 'd1',
        authorId: 'other',
        privacyScope: 'private',
        groupShares: [],
      };
      prisma.diary.findUnique.mockResolvedValue(diary);

      await expect(service.getDiary('u1', 'd1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateDiary / deleteDiary', () => {
    it('작성자가 아니면 수정 시 ForbiddenException을 던진다', async () => {
      prisma.diary.findUnique.mockResolvedValue({
        id: 'd1',
        authorId: 'other',
      });

      await expect(
        service.updateDiary('u1', 'd1', { content: '수정' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('작성자가 아니면 삭제 시 ForbiddenException을 던진다', async () => {
      prisma.diary.findUnique.mockResolvedValue({
        id: 'd1',
        authorId: 'other',
      });

      await expect(service.deleteDiary('u1', 'd1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('작성자면 삭제 시 share와 diary를 함께 지운다', async () => {
      prisma.diary.findUnique.mockResolvedValue({ id: 'd1', authorId: 'u1' });
      prisma.$transaction.mockResolvedValue(undefined);

      await service.deleteDiary('u1', 'd1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getTodayPrompt', () => {
    it('프롬프트가 없으면 NotFoundException을 던진다', async () => {
      prisma.dailyPrompt.findFirst.mockResolvedValue(null);

      await expect(service.getTodayPrompt()).rejects.toThrow(NotFoundException);
    });

    it('가장 최근 프롬프트를 반환한다', async () => {
      const prompt = { id: 'p1' };
      prisma.dailyPrompt.findFirst.mockResolvedValue(prompt);

      await expect(service.getTodayPrompt()).resolves.toBe(prompt);
    });
  });
});
