import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendService } from './friend.service';

describe('FriendService', () => {
  let service: FriendService;
  let prisma: {
    user: { findUnique: jest.Mock };
    friendRequest: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    friendship: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      friendRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      friendship: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new FriendService(prisma as unknown as PrismaService);
  });

  describe('sendRequest', () => {
    it('본인에게 요청을 보내면 BadRequestException을 던진다', async () => {
      await expect(service.sendRequest('u1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('대상 사용자가 없으면 NotFoundException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.sendRequest('u1', 'u2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('이미 친구면 ConflictException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.friendship.findFirst.mockResolvedValue({ id: 'fs1' });

      await expect(service.sendRequest('u1', 'u2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('이미 요청이 진행 중이면 ConflictException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.friendship.findFirst.mockResolvedValue(null);
      prisma.friendRequest.findFirst.mockResolvedValue({ id: 'fr1' });

      await expect(service.sendRequest('u1', 'u2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('정상 요청이면 생성한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.friendship.findFirst.mockResolvedValue(null);
      prisma.friendRequest.findFirst.mockResolvedValue(null);
      const created = { id: 'fr1', requesterId: 'u1', addresseeId: 'u2' };
      prisma.friendRequest.create.mockResolvedValue(created);

      await expect(service.sendRequest('u1', 'u2')).resolves.toBe(created);
      expect(prisma.friendRequest.create).toHaveBeenCalledWith({
        data: { requesterId: 'u1', addresseeId: 'u2' },
      });
    });
  });

  describe('acceptRequest', () => {
    it('요청이 없으면 NotFoundException을 던진다', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue(null);

      await expect(service.acceptRequest('u2', 'fr1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('addressee가 아니면 ForbiddenException을 던진다', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'fr1',
        requesterId: 'u1',
        addresseeId: 'someone-else',
      });

      await expect(service.acceptRequest('u2', 'fr1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('정상이면 대칭 Friendship 2건 생성 + 요청 삭제를 트랜잭션으로 실행한다', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'fr1',
        requesterId: 'u1',
        addresseeId: 'u2',
      });

      await service.acceptRequest('u2', 'fr1');

      expect(prisma.friendship.create).toHaveBeenCalledWith({
        data: { userId: 'u1', friendId: 'u2' },
      });
      expect(prisma.friendship.create).toHaveBeenCalledWith({
        data: { userId: 'u2', friendId: 'u1' },
      });
      expect(prisma.friendRequest.delete).toHaveBeenCalledWith({
        where: { id: 'fr1' },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('rejectRequest', () => {
    it('요청 당사자가 아니면 ForbiddenException을 던진다', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'fr1',
        requesterId: 'a',
        addresseeId: 'b',
      });

      await expect(service.rejectRequest('c', 'fr1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('당사자면 삭제한다', async () => {
      prisma.friendRequest.findUnique.mockResolvedValue({
        id: 'fr1',
        requesterId: 'a',
        addresseeId: 'b',
      });

      await service.rejectRequest('a', 'fr1');

      expect(prisma.friendRequest.delete).toHaveBeenCalledWith({
        where: { id: 'fr1' },
      });
    });
  });

  describe('listFriends', () => {
    it('userId 기준 Friendship row의 friend만 반환한다', async () => {
      const friend1 = { id: 'u2', name: '친구1' };
      const friend2 = { id: 'u3', name: '친구2' };
      prisma.friendship.findMany.mockResolvedValue([
        { userId: 'u1', friendId: 'u2', friend: friend1 },
        { userId: 'u1', friendId: 'u3', friend: friend2 },
      ]);

      await expect(service.listFriends('u1')).resolves.toEqual([
        friend1,
        friend2,
      ]);
      expect(prisma.friendship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
    });
  });

  describe('unfriend', () => {
    it('관계가 없으면 NotFoundException을 던진다', async () => {
      prisma.friendship.findFirst.mockResolvedValue(null);

      await expect(service.unfriend('u1', 'u2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('관계가 있으면 양방향 row를 모두 삭제한다', async () => {
      prisma.friendship.findFirst.mockResolvedValue({ id: 'fs1' });

      await service.unfriend('u1', 'u2');

      expect(prisma.friendship.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: 'u1', friendId: 'u2' },
            { userId: 'u2', friendId: 'u1' },
          ],
        },
      });
    });
  });
});
