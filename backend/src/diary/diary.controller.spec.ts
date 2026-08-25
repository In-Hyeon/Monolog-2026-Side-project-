import type { User } from '@prisma/client';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';

// FirebaseAuthGuard가 firebase-admin/auth(→ESM 전용 jose)를 실제로 로드하는 걸 막기 위한 모킹.
// 자세한 이유는 auth/guards/firebase-auth.guard.spec.ts 상단 주석 참고.
jest.mock('../auth/firebase/firebase-admin.service');

describe('DiaryController', () => {
  let controller: DiaryController;
  let diaryService: {
    createDiary: jest.Mock;
    listMyDiaries: jest.Mock;
    getTodayPrompt: jest.Mock;
    getDiary: jest.Mock;
    updateDiary: jest.Mock;
    deleteDiary: jest.Mock;
  };
  const user = { id: 'u1' } as User;

  beforeEach(() => {
    diaryService = {
      createDiary: jest.fn(),
      listMyDiaries: jest.fn(),
      getTodayPrompt: jest.fn(),
      getDiary: jest.fn(),
      updateDiary: jest.fn(),
      deleteDiary: jest.fn(),
    };
    controller = new DiaryController(diaryService as unknown as DiaryService);
  });

  it('createDiary: userId와 dto를 서비스로 위임한다', () => {
    const dto = {
      entryType: 'quick' as const,
      content: '오늘의 일기',
      privacyScope: 'private' as const,
    };

    void controller.createDiary(user, dto);

    expect(diaryService.createDiary).toHaveBeenCalledWith('u1', dto);
  });

  it('listMyDiaries: userId를 서비스로 위임한다', () => {
    void controller.listMyDiaries(user);

    expect(diaryService.listMyDiaries).toHaveBeenCalledWith('u1');
  });

  it('getTodayPrompt: 인자 없이 서비스로 위임한다', () => {
    void controller.getTodayPrompt();

    expect(diaryService.getTodayPrompt).toHaveBeenCalledWith();
  });

  it('getDiary: userId와 diaryId를 서비스로 위임한다', () => {
    void controller.getDiary(user, 'd1');

    expect(diaryService.getDiary).toHaveBeenCalledWith('u1', 'd1');
  });

  it('updateDiary: userId, diaryId, dto를 서비스로 위임한다', () => {
    const dto = { content: '수정된 내용' };

    void controller.updateDiary(user, 'd1', dto);

    expect(diaryService.updateDiary).toHaveBeenCalledWith('u1', 'd1', dto);
  });

  it('deleteDiary: userId와 diaryId를 서비스로 위임한다', () => {
    void controller.deleteDiary(user, 'd1');

    expect(diaryService.deleteDiary).toHaveBeenCalledWith('u1', 'd1');
  });
});
