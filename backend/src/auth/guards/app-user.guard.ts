import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * FirebaseAuthGuard 뒤에서 실행되어야 한다 (request.user가 이미 채워져 있어야 함).
 * firebaseUid로 내부 User 레코드를 조회해 request.appUser에 채운다.
 * 아직 회원가입(POST /user)을 하지 않은 사용자는 여기서 걸러진다.
 */
@Injectable()
export class AppUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const firebaseUid = request.user?.uid;

    if (!firebaseUid) {
      throw new NotFoundException('인증 정보가 없습니다.');
    }

    const appUser = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!appUser) {
      throw new NotFoundException(
        '아직 등록되지 않은 사용자입니다. 프로필을 먼저 등록해주세요.',
      );
    }

    request.appUser = appUser;
    return true;
  }
}
