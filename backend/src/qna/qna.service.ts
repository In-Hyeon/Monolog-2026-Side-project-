import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupAnswer, GroupQuestion } from '@prisma/client';
import { GroupService } from '../group/group.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

const QUESTION_TTL_HOURS = 48;

@Injectable()
export class QnaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupService: GroupService,
  ) {}

  async createQuestion(
    userId: string,
    groupId: string,
    dto: CreateQuestionDto,
  ): Promise<GroupQuestion> {
    await this.assertGroupMember(groupId, userId);

    const expiresAt = new Date(
      Date.now() + QUESTION_TTL_HOURS * 60 * 60 * 1000,
    );

    return this.prisma.groupQuestion.create({
      data: {
        groupId,
        authorId: userId,
        questionText: dto.questionText,
        photoUrl: dto.photoUrl,
        expiresAt,
      },
    });
  }

  async listActiveQuestions(
    userId: string,
    groupId: string,
  ): Promise<GroupQuestion[]> {
    await this.assertGroupMember(groupId, userId);

    return this.prisma.groupQuestion.findMany({
      where: { groupId, isDeleted: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuestion(
    userId: string,
    questionId: string,
  ): Promise<GroupQuestion> {
    const question = await this.findActiveQuestionOrThrow(questionId);
    await this.assertGroupMember(question.groupId, userId);
    return question;
  }

  async deleteQuestion(userId: string, questionId: string): Promise<void> {
    const question = await this.findActiveQuestionOrThrow(questionId);
    if (question.authorId !== userId) {
      throw new ForbiddenException('본인이 등록한 질문만 삭제할 수 있습니다.');
    }

    await this.prisma.groupQuestion.update({
      where: { id: questionId },
      data: { isDeleted: true },
    });
  }

  async createAnswer(
    userId: string,
    questionId: string,
    dto: CreateAnswerDto,
  ): Promise<GroupAnswer> {
    const question = await this.findActiveQuestionOrThrow(questionId);
    await this.assertGroupMember(question.groupId, userId);

    return this.prisma.groupAnswer.create({
      data: {
        questionId,
        authorId: userId,
        answerText: dto.answerText,
        photoUrl: dto.photoUrl,
      },
    });
  }

  async listAnswers(
    userId: string,
    questionId: string,
  ): Promise<GroupAnswer[]> {
    const question = await this.findActiveQuestionOrThrow(questionId);
    await this.assertGroupMember(question.groupId, userId);

    return this.prisma.groupAnswer.findMany({
      where: { questionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async bookmarkQuestion(userId: string, questionId: string): Promise<void> {
    const question = await this.findActiveQuestionOrThrow(questionId);
    await this.assertGroupMember(question.groupId, userId);

    await this.prisma.questionBookmark.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {},
      create: { userId, questionId },
    });
  }

  async unbookmarkQuestion(userId: string, questionId: string): Promise<void> {
    await this.prisma.questionBookmark.deleteMany({
      where: { userId, questionId },
    });
  }

  async bookmarkAnswer(userId: string, answerId: string): Promise<void> {
    const answer = await this.prisma.groupAnswer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });
    if (!answer) {
      throw new NotFoundException('답변을 찾을 수 없습니다.');
    }
    await this.assertGroupMember(answer.question.groupId, userId);

    await this.prisma.answerBookmark.upsert({
      where: { userId_answerId: { userId, answerId } },
      update: {},
      create: { userId, answerId },
    });
  }

  async unbookmarkAnswer(userId: string, answerId: string): Promise<void> {
    await this.prisma.answerBookmark.deleteMany({
      where: { userId, answerId },
    });
  }

  private async findActiveQuestionOrThrow(
    questionId: string,
  ): Promise<GroupQuestion> {
    const question = await this.prisma.groupQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question || question.isDeleted) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }
    return question;
  }

  private async assertGroupMember(
    groupId: string,
    userId: string,
  ): Promise<void> {
    const isMember = await this.groupService.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('그룹 멤버만 접근할 수 있습니다.');
    }
  }
}
