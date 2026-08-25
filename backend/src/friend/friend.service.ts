import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Friend } from '@prisma/client';
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

  async sendRequest(requesterId: string, addresseeId: string): Promise<Friend> {
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

    const existing = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    if (existing) {
      throw new ConflictException('이미 친구이거나 요청이 진행 중입니다.');
    }

    return this.prisma.friend.create({
      data: { requesterId, addresseeId },
    });
  }

  listIncomingRequests(userId: string) {
    return this.prisma.friend.findMany({
      where: { addresseeId: userId, status: 'pending' },
      include: { requester: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOutgoingRequests(userId: string) {
    return this.prisma.friend.findMany({
      where: { requesterId: userId, status: 'pending' },
      include: { addressee: { select: PUBLIC_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptRequest(userId: string, requestId: string): Promise<Friend> {
    const request = await this.prisma.friend.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== 'pending') {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }
    if (request.addresseeId !== userId) {
      throw new ForbiddenException('본인에게 온 요청만 수락할 수 있습니다.');
    }

    return this.prisma.friend.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });
  }

  async rejectRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.prisma.friend.findUnique({
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

    await this.prisma.friend.delete({ where: { id: requestId } });
  }

  async listFriends(userId: string) {
    const rows = await this.prisma.friend.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: PUBLIC_USER_SELECT },
        addressee: { select: PUBLIC_USER_SELECT },
      },
    });

    return rows.map((row) =>
      row.requesterId === userId ? row.addressee : row.requester,
    );
  }

  async unfriend(userId: string, friendUserId: string): Promise<void> {
    const row = await this.prisma.friend.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId, addresseeId: friendUserId },
          { requesterId: friendUserId, addresseeId: userId },
        ],
      },
    });
    if (!row) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    await this.prisma.friend.delete({ where: { id: row.id } });
  }
}
