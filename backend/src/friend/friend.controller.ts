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
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendService } from './friend.service';

@UseGuards(FirebaseAuthGuard, AppUserGuard)
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('requests')
  sendRequest(@CurrentAppUser() user: User, @Body() dto: SendFriendRequestDto) {
    return this.friendService.sendRequest(user.id, dto.addresseeId);
  }

  @Get('requests/incoming')
  listIncoming(@CurrentAppUser() user: User) {
    return this.friendService.listIncomingRequests(user.id);
  }

  @Get('requests/outgoing')
  listOutgoing(@CurrentAppUser() user: User) {
    return this.friendService.listOutgoingRequests(user.id);
  }

  @Patch('requests/:id/accept')
  acceptRequest(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.friendService.acceptRequest(user.id, id);
  }

  @Delete('requests/:id')
  rejectRequest(@CurrentAppUser() user: User, @Param('id') id: string) {
    return this.friendService.rejectRequest(user.id, id);
  }

  @Get()
  listFriends(@CurrentAppUser() user: User) {
    return this.friendService.listFriends(user.id);
  }

  @Delete(':friendUserId')
  unfriend(
    @CurrentAppUser() user: User,
    @Param('friendUserId') friendUserId: string,
  ) {
    return this.friendService.unfriend(user.id, friendUserId);
  }
}
