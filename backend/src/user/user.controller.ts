import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { UpsertUserProfileDto } from './dto/upsert-user-profile.dto';
import { UserService } from './user.service';

@UseGuards(FirebaseAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  upsertProfile(
    @CurrentUser() firebaseUser: DecodedIdToken,
    @Body() dto: UpsertUserProfileDto,
  ) {
    if (!firebaseUser.email) {
      throw new BadRequestException('이메일 정보가 없는 계정입니다.');
    }
    return this.userService.upsertProfile(
      firebaseUser.uid,
      firebaseUser.email,
      dto,
    );
  }

  @Get('me')
  findMe(@CurrentUser() firebaseUser: DecodedIdToken) {
    return this.userService.findMe(firebaseUser.uid);
  }

  @Get(':id')
  findPublicProfile(@Param('id') id: string) {
    return this.userService.findPublicProfile(id);
  }
}
