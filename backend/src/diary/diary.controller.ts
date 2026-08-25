import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { AppUserGuard } from '../auth/guards/app-user.guard';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@UseGuards(FirebaseAuthGuard, AppUserGuard)
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  createDiary(@CurrentAppUser() user: User, @Body() dto: CreateDiaryDto) {
    return this.diaryService.createDiary(user.id, dto);
  }

  @Get('me')
  listMyDiaries(@CurrentAppUser() user: User) {
    return this.diaryService.listMyDiaries(user.id);
  }

  @Get('prompt/today')
  getTodayPrompt() {
    return this.diaryService.getTodayPrompt();
  }

  @Get(':id')
  getDiary(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.diaryService.getDiary(user.id, id);
  }

  @Patch(':id')
  updateDiary(
    @CurrentAppUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateDiaryDto,
  ) {
    return this.diaryService.updateDiary(user.id, id, dto);
  }

  @Delete(':id')
  deleteDiary(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.diaryService.deleteDiary(user.id, id);
  }
}
