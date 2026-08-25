import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { AppUserGuard } from '../auth/guards/app-user.guard';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QnaService } from './qna.service';

@UseGuards(FirebaseAuthGuard, AppUserGuard)
@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Post('groups/:groupId/questions')
  createQuestion(
    @CurrentAppUser() user: User,
    @Param('groupId') groupId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.qnaService.createQuestion(user.id, groupId, dto);
  }

  @Get('groups/:groupId/questions')
  listActiveQuestions(
    @CurrentAppUser() user: User,
    @Param('groupId') groupId: string,
  ) {
    return this.qnaService.listActiveQuestions(user.id, groupId);
  }

  @Get('questions/:id')
  getQuestion(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.getQuestion(user.id, id);
  }

  @Delete('questions/:id')
  deleteQuestion(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.deleteQuestion(user.id, id);
  }

  @Post('questions/:id/answers')
  createAnswer(
    @CurrentAppUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.qnaService.createAnswer(user.id, id, dto);
  }

  @Get('questions/:id/answers')
  listAnswers(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.listAnswers(user.id, id);
  }

  @Post('questions/:id/bookmark')
  bookmarkQuestion(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.bookmarkQuestion(user.id, id);
  }

  @Delete('questions/:id/bookmark')
  unbookmarkQuestion(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.unbookmarkQuestion(user.id, id);
  }

  @Post('answers/:id/bookmark')
  bookmarkAnswer(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.bookmarkAnswer(user.id, id);
  }

  @Delete('answers/:id/bookmark')
  unbookmarkAnswer(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.qnaService.unbookmarkAnswer(user.id, id);
  }
}
