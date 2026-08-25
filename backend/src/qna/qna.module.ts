import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';

@Module({
  imports: [GroupModule],
  controllers: [QnaController],
  providers: [QnaService],
})
export class QnaModule {}
