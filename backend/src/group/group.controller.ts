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
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { GroupService } from './group.service';

@UseGuards(FirebaseAuthGuard, AppUserGuard)
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  createGroup(@CurrentAppUser() user: User, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(user.id, dto.name);
  }

  @Get('mine')
  listMyGroups(@CurrentAppUser() user: User) {
    return this.groupService.listMyGroups(user.id);
  }

  @Post('join')
  joinGroup(@CurrentAppUser() user: User, @Body() dto: JoinGroupDto) {
    return this.groupService.joinGroup(user.id, dto.inviteCode);
  }

  @Get(':id')
  getGroupDetail(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.groupService.getGroupDetail(user.id, id);
  }

  @Delete(':id/leave')
  leaveGroup(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.groupService.leaveGroup(user.id, id);
  }
}
