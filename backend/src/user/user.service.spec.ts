import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: { upsert: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      user: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new UserService(prisma as unknown as PrismaService);
  });

  describe('upsertProfile', () => {
    it('firebaseUid를 기준으로 upsert를 호출한다', async () => {
      const user = { id: 'u1' };
      prisma.user.upsert.mockResolvedValue(user);

      const result = await service.upsertProfile('uid-1', 'a@test.com', {
        name: '홍길동',
      });

      expect(result).toBe(user);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { firebaseUid: 'uid-1' },
        update: { name: '홍길동', profileImage: undefined },
        create: {
          firebaseUid: 'uid-1',
          email: 'a@test.com',
          name: '홍길동',
          profileImage: undefined,
        },
      });
    });
  });

  describe('findMe', () => {
    it('존재하면 사용자를 반환한다', async () => {
      const user = { id: 'u1' };
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.findMe('uid-1')).resolves.toBe(user);
    });

    it('존재하지 않으면 NotFoundException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findMe('uid-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublicProfile', () => {
    it('존재하면 공개 필드만 반환한다', async () => {
      const publicProfile = {
        id: 'id-1',
        name: '홍길동',
        profileImage: null,
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(publicProfile);

      await expect(service.findPublicProfile('id-1')).resolves.toBe(
        publicProfile,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'id-1' },
        select: {
          id: true,
          name: true,
          profileImage: true,
          createdAt: true,
        },
      });
    });

    it('존재하지 않으면 NotFoundException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findPublicProfile('id-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
