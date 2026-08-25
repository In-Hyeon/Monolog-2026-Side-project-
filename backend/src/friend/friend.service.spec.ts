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
    friend: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      friend: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
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

    it('이미 관계가 존재하면 ConflictException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.friend.findFirst.mockResolvedValue({ id: 'f1' });

      await expect(service.sendRequest('u1', 'u2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('정상 요청이면 pending 상태로 생성한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.friend.findFirst.mockResolvedValue(null);
      const created = { id: 'f1', requesterId: 'u1', addresseeId: 'u2' };
      prisma.friend.create.mockResolvedValue(created);

      await expect(service.sendRequest('u1', 'u2')).resolves.toBe(created);
      expect(prisma.friend.create).toHaveBeenCalledWith({
        data: { requesterId: 'u1', addresseeId: 'u2' },
      });
    });
  });

  describe('acceptRequest', () => {
    it('요청이 없으면 NotFoundException을 던진다', async () => {
      prisma.friend.findUnique.mockResolvedValue(null);

      await expect(service.acceptRequest('u2', 'f1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('addressee가 아니면 ForbiddenException을 던진다', async () => {
      prisma.friend.findUnique.mockResolvedValue({
        id: 'f1',
        status: 'pending',
        addresseeId: 'someone-else',
      });

      await expect(service.acceptRequest('u2', 'f1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('정상이면 accepted로 업데이트한다', async () => {
      prisma.friend.findUnique.mockResolvedValue({
        id: 'f1',
        status: 'pending',
        addresseeId: 'u2',
      });
      const updated = { id: 'f1', status: 'accepted' };
      prisma.friend.update.mockResolvedValue(updated);

      await expect(service.acceptRequest('u2', 'f1')).resolves.toBe(updated);
      expect(prisma.friend.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { status: 'accepted' },
      });
    });
  });

  describe('rejectRequest', () => {
    it('요청 당사자가 아니면 ForbiddenException을 던진다', async () => {
      prisma.friend.findUnique.mockResolvedValue({
        id: 'f1',
        requesterId: 'a',
        addresseeId: 'b',
      });

      await expect(service.rejectRequest('c', 'f1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('당사자면 삭제한다', async () => {
      prisma.friend.findUnique.mockResolvedValue({
        id: 'f1',
        requesterId: 'a',
        addresseeId: 'b',
      });

      await service.rejectRequest('a', 'f1');

      expect(prisma.friend.delete).toHaveBeenCalledWith({
        where: { id: 'f1' },
      });
    });
  });

  describe('listFriends', () => {
    it('내가 requester/addressee인 쪽의 상대방만 반환한다', async () => {
      const other1 = { id: 'u2', name: '친구1' };
      const other2 = { id: 'u3', name: '친구2' };
      prisma.friend.findMany.mockResolvedValue([
        {
          requesterId: 'u1',
          addresseeId: 'u2',
          requester: null,
          addressee: other1,
        },
        {
          requesterId: 'u3',
          addresseeId: 'u1',
          requester: other2,
          addressee: null,
        },
      ]);

      await expect(service.listFriends('u1')).resolves.toEqual([
        other1,
        other2,
      ]);
    });
  });

  describe('unfriend', () => {
    it('관계가 없으면 NotFoundException을 던진다', async () => {
      prisma.friend.findFirst.mockResolvedValue(null);

      await expect(service.unfriend('u1', 'u2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('관계가 있으면 삭제한다', async () => {
      prisma.friend.findFirst.mockResolvedValue({ id: 'f1' });

      await service.unfriend('u1', 'u2');

      expect(prisma.friend.delete).toHaveBeenCalledWith({
        where: { id: 'f1' },
      });
    });
  });
});
