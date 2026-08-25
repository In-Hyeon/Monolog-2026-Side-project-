import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import type { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

// firebase-admin.service.ts는 firebase-admin/auth를 실제로 로드하는데,
// 그 의존성 체인에 있는 jose가 ESM 전용이라 Jest의 CJS 모듈 로더에서 파싱 에러가 난다.
// (실제 Node 런타임은 require(esm) 상호운용으로 문제없이 동작함 — 여기선 순수 단위 테스트 격리 목적으로
// __mocks__/firebase-admin.service.ts로 대체한다. FirebaseAuthGuard를 사용하는 모든 spec에서 동일하게 적용)
jest.mock('../firebase/firebase-admin.service');

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let firebaseAdminService: { verifyIdToken: jest.Mock };

  beforeEach(() => {
    firebaseAdminService = { verifyIdToken: jest.fn() };
    guard = new FirebaseAuthGuard(
      firebaseAdminService as unknown as FirebaseAdminService,
    );
  });

  function createContext(headers: Record<string, string> = {}) {
    const request = { headers, user: undefined } as unknown as Request;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('Authorization 헤더가 없으면 UnauthorizedException을 던진다', async () => {
    const context = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(firebaseAdminService.verifyIdToken).not.toHaveBeenCalled();
  });

  it('Bearer 스킴이 아니면 UnauthorizedException을 던진다', async () => {
    const context = createContext({ authorization: 'Basic abc123' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('토큰 검증에 실패하면 UnauthorizedException을 던진다', async () => {
    firebaseAdminService.verifyIdToken.mockRejectedValue(
      new Error('invalid token'),
    );
    const context = createContext({ authorization: 'Bearer bad-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('토큰 검증에 성공하면 true를 반환하고 request.user에 디코딩된 값을 담는다', async () => {
    const decoded = { uid: 'firebase-uid-123' };
    firebaseAdminService.verifyIdToken.mockResolvedValue(decoded);
    const request = {
      headers: { authorization: 'Bearer good-token' },
      user: undefined,
    } as unknown as Request;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBe(decoded);
    expect(firebaseAdminService.verifyIdToken).toHaveBeenCalledWith(
      'good-token',
    );
  });
});
