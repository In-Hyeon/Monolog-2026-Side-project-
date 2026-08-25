import type { User } from '@prisma/client';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';

// FirebaseAuthGuard가 firebase-admin/auth(→ESM 전용 jose)를 실제로 로드하는 걸 막기 위한 모킹.
// 자세한 이유는 auth/guards/firebase-auth.guard.spec.ts 상단 주석 참고.
jest.mock('../auth/firebase/firebase-admin.service');

describe('FriendController', () => {
  let controller: FriendController;
  let friendService: {
    sendRequest: jest.Mock;
    listIncomingRequests: jest.Mock;
    listOutgoingRequests: jest.Mock;
    acceptRequest: jest.Mock;
    rejectRequest: jest.Mock;
    listFriends: jest.Mock;
    unfriend: jest.Mock;
  };
  const user = { id: 'u1' } as User;

  beforeEach(() => {
    friendService = {
      sendRequest: jest.fn(),
      listIncomingRequests: jest.fn(),
      listOutgoingRequests: jest.fn(),
      acceptRequest: jest.fn(),
      rejectRequest: jest.fn(),
      listFriends: jest.fn(),
      unfriend: jest.fn(),
    };
    controller = new FriendController(
      friendService as unknown as FriendService,
    );
  });

  it('sendRequest: userId와 addresseeId를 서비스로 위임한다', () => {
    void controller.sendRequest(user, { addresseeId: 'u2' });

    expect(friendService.sendRequest).toHaveBeenCalledWith('u1', 'u2');
  });

  it('listIncoming: userId를 서비스로 위임한다', () => {
    void controller.listIncoming(user);

    expect(friendService.listIncomingRequests).toHaveBeenCalledWith('u1');
  });

  it('listOutgoing: userId를 서비스로 위임한다', () => {
    void controller.listOutgoing(user);

    expect(friendService.listOutgoingRequests).toHaveBeenCalledWith('u1');
  });

  it('acceptRequest: userId와 요청 id를 서비스로 위임한다', () => {
    void controller.acceptRequest(user, 'f1');

    expect(friendService.acceptRequest).toHaveBeenCalledWith('u1', 'f1');
  });

  it('rejectRequest: userId와 요청 id를 서비스로 위임한다', () => {
    void controller.rejectRequest(user, 'f1');

    expect(friendService.rejectRequest).toHaveBeenCalledWith('u1', 'f1');
  });

  it('listFriends: userId를 서비스로 위임한다', () => {
    void controller.listFriends(user);

    expect(friendService.listFriends).toHaveBeenCalledWith('u1');
  });

  it('unfriend: userId와 상대방 id를 서비스로 위임한다', () => {
    void controller.unfriend(user, 'u2');

    expect(friendService.unfriend).toHaveBeenCalledWith('u1', 'u2');
  });
});
