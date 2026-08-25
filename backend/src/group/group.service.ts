import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMember, Groups } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_CODE_TTL_DAYS = 7;

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  profileImage: true,
  createdAt: true,
} as const;

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(ownerId: string, name: string): Promise<Groups> {
    const inviteCode = this.generateInviteCode();
    const codeExpiresAt = new Date(
      Date.now() + INVITE_CODE_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.groups.create({
        data: { name, ownerId, inviteCode, codeExpiresAt },
      });
      await tx.groupMember.create({
        data: { groupId: group.id, userId: ownerId, role: 'owner' },
      });
      return group;
    });
  }

  listMyGroups(userId: string): Promise<Groups[]> {
    return this.prisma.groups.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGroupDetail(userId: string, groupId: string) {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: { select: PUBLIC_USER_SELECT } } },
      },
    });
    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    const isMember = group.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('그룹 멤버만 접근할 수 있습니다.');
    }

    return group;
  }

  async joinGroup(userId: string, inviteCode: string): Promise<GroupMember> {
    const group = await this.prisma.groups.findUnique({
      where: { inviteCode },
    });
    if (!group) {
      throw new NotFoundException('유효하지 않은 초대 코드입니다.');
    }
    if (group.codeExpiresAt < new Date()) {
      throw new BadRequestException('만료된 초대 코드입니다.');
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) {
      throw new ConflictException('이미 가입된 그룹입니다.');
    }

    return this.prisma.groupMember.create({
      data: { groupId: group.id, userId, role: 'member' },
    });
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) {
      throw new NotFoundException('그룹 멤버가 아닙니다.');
    }
    if (membership.role === 'owner') {
      throw new ForbiddenException(
        '그룹 소유자는 그룹을 나갈 수 없습니다. 그룹을 삭제하거나 소유권을 위임해주세요.',
      );
    }

    await this.prisma.groupMember.delete({ where: { id: membership.id } });
  }

  /** diary/qna 모듈에서 그룹 멤버십을 확인할 때 재사용한다. */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    return !!membership;
  }

  private generateInviteCode(): string {
    return randomBytes(6).toString('hex');
  }
}
