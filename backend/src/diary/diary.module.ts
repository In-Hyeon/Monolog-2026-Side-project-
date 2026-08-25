import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';

@Module({
  imports: [GroupModule],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}
