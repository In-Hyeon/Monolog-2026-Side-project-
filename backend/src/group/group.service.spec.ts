import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroupService } from './group.service';

describe('GroupService', () => {
  let service: GroupService;
  let prisma: {
    groups: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
    groupMember: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      groups: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      groupMember: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new GroupService(prisma as unknown as PrismaService);
  });

  describe('createGroup', () => {
    it('그룹과 owner 멤버십을 트랜잭션으로 생성한다', async () => {
      const group = { id: 'g1', name: '가족방', ownerId: 'u1' };
      prisma.groups.create.mockResolvedValue(group);
      prisma.groupMember.create.mockResolvedValue({});
      prisma.$transaction.mockImplementation(
        (fn: (tx: typeof prisma) => unknown) => fn(prisma),
      );

      await expect(service.createGroup('u1', '가족방')).resolves.toBe(group);
      expect(prisma.groups.create).toHaveBeenCalled();
      expect(prisma.groupMember.create).toHaveBeenCalledWith({
        data: { groupId: 'g1', userId: 'u1', role: 'owner' },
      });
    });
  });

  describe('getGroupDetail', () => {
    it('그룹이 없으면 NotFoundException을 던진다', async () => {
      prisma.groups.findUnique.mockResolvedValue(null);

      await expect(service.getGroupDetail('u1', 'g1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('멤버가 아니면 ForbiddenException을 던진다', async () => {
      prisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        members: [{ userId: 'other' }],
      });

      await expect(service.getGroupDetail('u1', 'g1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('멤버면 그룹 상세를 반환한다', async () => {
      const group = { id: 'g1', members: [{ userId: 'u1' }] };
      prisma.groups.findUnique.mockResolvedValue(group);

      await expect(service.getGroupDetail('u1', 'g1')).resolves.toBe(group);
    });
  });

  describe('joinGroup', () => {
    it('초대 코드가 유효하지 않으면 NotFoundException을 던진다', async () => {
      prisma.groups.findUnique.mockResolvedValue(null);

      await expect(service.joinGroup('u1', 'bad-code')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('초대 코드가 만료되었으면 BadRequestException을 던진다', async () => {
      prisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        codeExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.joinGroup('u1', 'code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('이미 가입된 멤버면 ConflictException을 던진다', async () => {
      prisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        codeExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'm1' });

      await expect(service.joinGroup('u1', 'code')).rejects.toThrow(
        ConflictException,
      );
    });

    it('정상이면 member 역할로 가입한다', async () => {
      prisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        codeExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      prisma.groupMember.findUnique.mockResolvedValue(null);
      const membership = { id: 'm1', role: 'member' };
      prisma.groupMember.create.mockResolvedValue(membership);

      await expect(service.joinGroup('u1', 'code')).resolves.toBe(membership);
      expect(prisma.groupMember.create).toHaveBeenCalledWith({
        data: { groupId: 'g1', userId: 'u1', role: 'member' },
      });
    });
  });

  describe('leaveGroup', () => {
    it('멤버가 아니면 NotFoundException을 던진다', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.leaveGroup('u1', 'g1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('owner면 ForbiddenException을 던진다', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({
        id: 'm1',
        role: 'owner',
      });

      await expect(service.leaveGroup('u1', 'g1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('일반 멤버면 탈퇴 처리한다', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({
        id: 'm1',
        role: 'member',
      });

      await service.leaveGroup('u1', 'g1');

      expect(prisma.groupMember.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
    });
  });

  describe('isMember', () => {
    it('멤버십이 있으면 true를 반환한다', async () => {
      prisma.groupMember.findUnique.mockResolvedValue({ id: 'm1' });

      await expect(service.isMember('g1', 'u1')).resolves.toBe(true);
    });

    it('멤버십이 없으면 false를 반환한다', async () => {
      prisma.groupMember.findUnique.mockResolvedValue(null);

      await expect(service.isMember('g1', 'u1')).resolves.toBe(false);
    });
  });
});
