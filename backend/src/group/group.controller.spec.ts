import type { User } from '@prisma/client';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

// FirebaseAuthGuard가 firebase-admin/auth(→ESM 전용 jose)를 실제로 로드하는 걸 막기 위한 모킹.
// 자세한 이유는 auth/guards/firebase-auth.guard.spec.ts 상단 주석 참고.
jest.mock('../auth/firebase/firebase-admin.service');

describe('GroupController', () => {
  let controller: GroupController;
  let groupService: {
    createGroup: jest.Mock;
    listMyGroups: jest.Mock;
    joinGroup: jest.Mock;
    getGroupDetail: jest.Mock;
    leaveGroup: jest.Mock;
  };
  const user = { id: 'u1' } as User;

  beforeEach(() => {
    groupService = {
      createGroup: jest.fn(),
      listMyGroups: jest.fn(),
      joinGroup: jest.fn(),
      getGroupDetail: jest.fn(),
      leaveGroup: jest.fn(),
    };
    controller = new GroupController(groupService as unknown as GroupService);
  });

  it('createGroup: userId와 name을 서비스로 위임한다', () => {
    void controller.createGroup(user, { name: '가족방' });

    expect(groupService.createGroup).toHaveBeenCalledWith('u1', '가족방');
  });

  it('listMyGroups: userId를 서비스로 위임한다', () => {
    void controller.listMyGroups(user);

    expect(groupService.listMyGroups).toHaveBeenCalledWith('u1');
  });

  it('joinGroup: userId와 inviteCode를 서비스로 위임한다', () => {
    void controller.joinGroup(user, { inviteCode: 'code123' });

    expect(groupService.joinGroup).toHaveBeenCalledWith('u1', 'code123');
  });

  it('getGroupDetail: userId와 groupId를 서비스로 위임한다', () => {
    void controller.getGroupDetail(user, 'g1');

    expect(groupService.getGroupDetail).toHaveBeenCalledWith('u1', 'g1');
  });

  it('leaveGroup: userId와 groupId를 서비스로 위임한다', () => {
    void controller.leaveGroup(user, 'g1');

    expect(groupService.leaveGroup).toHaveBeenCalledWith('u1', 'g1');
  });
});
