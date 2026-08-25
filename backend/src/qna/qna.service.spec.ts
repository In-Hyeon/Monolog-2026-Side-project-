import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupService } from '../group/group.service';
import { PrismaService } from '../prisma/prisma.service';
import { QnaService } from './qna.service';

describe('QnaService', () => {
  let service: QnaService;
  let prisma: {
    groupQuestion: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    groupAnswer: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    questionBookmark: { upsert: jest.Mock; deleteMany: jest.Mock };
    answerBookmark: { upsert: jest.Mock; deleteMany: jest.Mock };
  };
  let groupService: { isMember: jest.Mock };

  beforeEach(() => {
    prisma = {
      groupQuestion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      groupAnswer: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      questionBookmark: { upsert: jest.fn(), deleteMany: jest.fn() },
      answerBookmark: { upsert: jest.fn(), deleteMany: jest.fn() },
    };
    groupService = { isMember: jest.fn() };
    service = new QnaService(
      prisma as unknown as PrismaService,
      groupService as unknown as GroupService,
    );
  });

  describe('createQuestion', () => {
    it('그룹 멤버가 아니면 ForbiddenException을 던진다', async () => {
      groupService.isMember.mockResolvedValue(false);

      await expect(
        service.createQuestion('u1', 'g1', { questionText: '질문' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('멤버면 질문을 생성한다', async () => {
      groupService.isMember.mockResolvedValue(true);
      const question = { id: 'q1' };
      prisma.groupQuestion.create.mockResolvedValue(question);

      await expect(
        service.createQuestion('u1', 'g1', { questionText: '질문' }),
      ).resolves.toBe(question);
    });
  });

  describe('getQuestion / deleteQuestion', () => {
    it('질문이 없거나 삭제되었으면 NotFoundException을 던진다', async () => {
      prisma.groupQuestion.findUnique.mockResolvedValue(null);

      await expect(service.getQuestion('u1', 'q1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('멤버가 아니면 ForbiddenException을 던진다', async () => {
      prisma.groupQuestion.findUnique.mockResolvedValue({
        id: 'q1',
        groupId: 'g1',
        isDeleted: false,
      });
      groupService.isMember.mockResolvedValue(false);

      await expect(service.getQuestion('u1', 'q1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('작성자가 아니면 삭제 시 ForbiddenException을 던진다', async () => {
      prisma.groupQuestion.findUnique.mockResolvedValue({
        id: 'q1',
        authorId: 'other',
        isDeleted: false,
      });

      await expect(service.deleteQuestion('u1', 'q1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('작성자면 소프트 삭제한다', async () => {
      prisma.groupQuestion.findUnique.mockResolvedValue({
        id: 'q1',
        authorId: 'u1',
        isDeleted: false,
      });

      await service.deleteQuestion('u1', 'q1');

      expect(prisma.groupQuestion.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { isDeleted: true },
      });
    });
  });

  describe('createAnswer', () => {
    it('멤버면 답변을 생성한다', async () => {
      prisma.groupQuestion.findUnique.mockResolvedValue({
        id: 'q1',
        groupId: 'g1',
        isDeleted: false,
      });
      groupService.isMember.mockResolvedValue(true);
      const answer = { id: 'a1' };
      prisma.groupAnswer.create.mockResolvedValue(answer);

      await expect(
        service.createAnswer('u1', 'q1', { answerText: '답변' }),
      ).resolves.toBe(answer);
    });
  });

  describe('bookmarkQuestion / unbookmarkQuestion', () => {
    it('멤버면 upsert로 북마크한다', async () => {
      prisma.groupQuestion.findUnique.mockResolvedValue({
        id: 'q1',
        groupId: 'g1',
        isDeleted: false,
      });
      groupService.isMember.mockResolvedValue(true);

      await service.bookmarkQuestion('u1', 'q1');

      expect(prisma.questionBookmark.upsert).toHaveBeenCalledWith({
        where: { userId_questionId: { userId: 'u1', questionId: 'q1' } },
        update: {},
        create: { userId: 'u1', questionId: 'q1' },
      });
    });

    it('북마크 해제는 조건 없이 deleteMany를 호출한다', async () => {
      await service.unbookmarkQuestion('u1', 'q1');

      expect(prisma.questionBookmark.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', questionId: 'q1' },
      });
    });
  });

  describe('bookmarkAnswer', () => {
    it('답변이 없으면 NotFoundException을 던진다', async () => {
      prisma.groupAnswer.findUnique.mockResolvedValue(null);

      await expect(service.bookmarkAnswer('u1', 'a1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('그룹 멤버가 아니면 ForbiddenException을 던진다', async () => {
      prisma.groupAnswer.findUnique.mockResolvedValue({
        id: 'a1',
        question: { groupId: 'g1' },
      });
      groupService.isMember.mockResolvedValue(false);

      await expect(service.bookmarkAnswer('u1', 'a1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('멤버면 upsert로 북마크한다', async () => {
      prisma.groupAnswer.findUnique.mockResolvedValue({
        id: 'a1',
        question: { groupId: 'g1' },
      });
      groupService.isMember.mockResolvedValue(true);

      await service.bookmarkAnswer('u1', 'a1');

      expect(prisma.answerBookmark.upsert).toHaveBeenCalledWith({
        where: { userId_answerId: { userId: 'u1', answerId: 'a1' } },
        update: {},
        create: { userId: 'u1', answerId: 'a1' },
      });
    });
  });
});
