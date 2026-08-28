import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  profileImage: true,
  createdAt: true,
} as const;

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async sendRequest(
    requesterId: string,
    addresseeId: string,
  ): Promise<FriendRequest> {
    if (requesterId === addresseeId) {
      throw new BadRequestException(
        '자기 자신에게 친구 요청을 보낼 수 없습니다.',
      );
    }

    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException('대상 사용자를 찾을 수 없습니다.');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: { userId: requesterId, friendId: addresseeId },
    });
    if (existingFriendship) {
      throw new ConflictException('이미 친구입니다.');
    }

    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    if (existingRequest) {
      throw new ConflictException('이미 친구 요청이 진행 중입니다.');
    }

    return this.prisma.friendRequest.create({
      data: { requesterId, addresseeId },
    });
  }

  listIncomingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { addresseeId: userId },
      include: { requester: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOutgoingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { requesterId: userId },
      include: { addressee: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }
    if (request.addresseeId !== userId) {
      throw new ForbiddenException('본인에게 온 요청만 수락할 수 있습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.friendship.create({
        data: { userId: request.requesterId, friendId: request.addresseeId },
      }),
      this.prisma.friendship.create({
        data: { userId: request.addresseeId, friendId: request.requesterId },
      }),
      this.prisma.friendRequest.delete({ where: { id: requestId } }),
    ]);
  }

  async rejectRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }
    if (request.requesterId !== userId && request.addresseeId !== userId) {
      throw new ForbiddenException(
        '본인과 관련된 요청만 취소/거절할 수 있습니다.',
      );
    }

    await this.prisma.friendRequest.delete({ where: { id: requestId } });
  }

  async listFriends(userId: string) {
    const rows = await this.prisma.friendship.findMany({
      where: { userId },
      include: { friend: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => row.friend);
  }

  async unfriend(userId: string, friendUserId: string): Promise<void> {
    const existing = await this.prisma.friendship.findFirst({
      where: { userId, friendId: friendUserId },
    });
    if (!existing) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId: friendUserId },
          { userId: friendUserId, friendId: userId },
        ],
      },
    });
  }
}
