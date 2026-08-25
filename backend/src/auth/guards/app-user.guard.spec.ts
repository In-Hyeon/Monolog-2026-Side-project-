import { NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AppUserGuard } from './app-user.guard';

describe('AppUserGuard', () => {
  let guard: AppUserGuard;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    guard = new AppUserGuard(prisma as unknown as PrismaService);
  });

  function createContext(request: Partial<Request>) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never;
  }

  it('request.user가 없으면 NotFoundException을 던진다', async () => {
    const request = { user: undefined, appUser: undefined } as Partial<Request>;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('firebaseUid로 User를 찾지 못하면 NotFoundException을 던진다', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const request = {
      user: { uid: 'fb-1' },
      appUser: undefined,
    } as unknown as Partial<Request>;

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('User를 찾으면 request.appUser에 채우고 true를 반환한다', async () => {
    const appUser = { id: 'u1', firebaseUid: 'fb-1' };
    prisma.user.findUnique.mockResolvedValue(appUser);
    const request = {
      user: { uid: 'fb-1' },
      appUser: undefined,
    } as unknown as Partial<Request>;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.appUser).toBe(appUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { firebaseUid: 'fb-1' },
    });
  });
});
