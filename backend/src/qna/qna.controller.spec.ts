import type { User } from '@prisma/client';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';

// FirebaseAuthGuard가 firebase-admin/auth(→ESM 전용 jose)를 실제로 로드하는 걸 막기 위한 모킹.
// 자세한 이유는 auth/guards/firebase-auth.guard.spec.ts 상단 주석 참고.
jest.mock('../auth/firebase/firebase-admin.service');

describe('QnaController', () => {
  let controller: QnaController;
  let qnaService: {
    createQuestion: jest.Mock;
    listActiveQuestions: jest.Mock;
    getQuestion: jest.Mock;
    deleteQuestion: jest.Mock;
    createAnswer: jest.Mock;
    listAnswers: jest.Mock;
    bookmarkQuestion: jest.Mock;
    unbookmarkQuestion: jest.Mock;
    bookmarkAnswer: jest.Mock;
    unbookmarkAnswer: jest.Mock;
  };
  const user = { id: 'u1' } as User;

  beforeEach(() => {
    qnaService = {
      createQuestion: jest.fn(),
      listActiveQuestions: jest.fn(),
      getQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
      createAnswer: jest.fn(),
      listAnswers: jest.fn(),
      bookmarkQuestion: jest.fn(),
      unbookmarkQuestion: jest.fn(),
      bookmarkAnswer: jest.fn(),
      unbookmarkAnswer: jest.fn(),
    };
    controller = new QnaController(qnaService as unknown as QnaService);
  });

  it('createQuestion: userId, groupId, dto를 서비스로 위임한다', () => {
    const dto = { questionText: '질문' };

    void controller.createQuestion(user, 'g1', dto);

    expect(qnaService.createQuestion).toHaveBeenCalledWith('u1', 'g1', dto);
  });

  it('listActiveQuestions: userId와 groupId를 서비스로 위임한다', () => {
    void controller.listActiveQuestions(user, 'g1');

    expect(qnaService.listActiveQuestions).toHaveBeenCalledWith('u1', 'g1');
  });

  it('getQuestion: userId와 questionId를 서비스로 위임한다', () => {
    void controller.getQuestion(user, 'q1');

    expect(qnaService.getQuestion).toHaveBeenCalledWith('u1', 'q1');
  });

  it('deleteQuestion: userId와 questionId를 서비스로 위임한다', () => {
    void controller.deleteQuestion(user, 'q1');

    expect(qnaService.deleteQuestion).toHaveBeenCalledWith('u1', 'q1');
  });

  it('createAnswer: userId, questionId, dto를 서비스로 위임한다', () => {
    const dto = { answerText: '답변' };

    void controller.createAnswer(user, 'q1', dto);

    expect(qnaService.createAnswer).toHaveBeenCalledWith('u1', 'q1', dto);
  });

  it('listAnswers: userId와 questionId를 서비스로 위임한다', () => {
    void controller.listAnswers(user, 'q1');

    expect(qnaService.listAnswers).toHaveBeenCalledWith('u1', 'q1');
  });

  it('bookmarkQuestion / unbookmarkQuestion: userId와 questionId를 서비스로 위임한다', () => {
    void controller.bookmarkQuestion(user, 'q1');
    void controller.unbookmarkQuestion(user, 'q1');

    expect(qnaService.bookmarkQuestion).toHaveBeenCalledWith('u1', 'q1');
    expect(qnaService.unbookmarkQuestion).toHaveBeenCalledWith('u1', 'q1');
  });

  it('bookmarkAnswer / unbookmarkAnswer: userId와 answerId를 서비스로 위임한다', () => {
    void controller.bookmarkAnswer(user, 'a1');
    void controller.unbookmarkAnswer(user, 'a1');

    expect(qnaService.bookmarkAnswer).toHaveBeenCalledWith('u1', 'a1');
    expect(qnaService.unbookmarkAnswer).toHaveBeenCalledWith('u1', 'a1');
  });
});
