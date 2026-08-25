import { BadRequestException } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { UserController } from './user.controller';
import { UserService } from './user.service';

// FirebaseAuthGuard가 firebase-admin/auth(→ESM 전용 jose)를 실제로 로드하는 걸 막기 위한 모킹.
// 자세한 이유는 auth/guards/firebase-auth.guard.spec.ts 상단 주석 참고.
jest.mock('../auth/firebase/firebase-admin.service');

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    upsertProfile: jest.Mock;
    findMe: jest.Mock;
    findPublicProfile: jest.Mock;
  };

  beforeEach(() => {
    userService = {
      upsertProfile: jest.fn(),
      findMe: jest.fn(),
      findPublicProfile: jest.fn(),
    };
    controller = new UserController(userService as unknown as UserService);
  });

  describe('upsertProfile', () => {
    it('이메일이 없는 토큰이면 BadRequestException을 던진다', () => {
      const firebaseUser = { uid: 'u1' } as DecodedIdToken;

      expect(() =>
        controller.upsertProfile(firebaseUser, { name: '홍길동' }),
      ).toThrow(BadRequestException);
      expect(userService.upsertProfile).not.toHaveBeenCalled();
    });

    it('uid/email/dto를 서비스로 위임한다', () => {
      const firebaseUser = {
        uid: 'u1',
        email: 'a@test.com',
      } as DecodedIdToken;
      const dto = { name: '홍길동' };

      void controller.upsertProfile(firebaseUser, dto);

      expect(userService.upsertProfile).toHaveBeenCalledWith(
        'u1',
        'a@test.com',
        dto,
      );
    });
  });

  it('findMe: uid를 서비스로 위임한다', () => {
    const firebaseUser = { uid: 'u1' } as DecodedIdToken;

    void controller.findMe(firebaseUser);

    expect(userService.findMe).toHaveBeenCalledWith('u1');
  });

  it('findPublicProfile: id를 서비스로 위임한다', () => {
    void controller.findPublicProfile('id-1');

    expect(userService.findPublicProfile).toHaveBeenCalledWith('id-1');
  });
});
