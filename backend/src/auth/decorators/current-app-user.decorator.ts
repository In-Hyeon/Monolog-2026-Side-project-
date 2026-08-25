import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';

/** AppUserGuard가 채운 request.appUser를 꺼낸다. AppUserGuard와 항상 함께 사용해야 한다. */
export const CurrentAppUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.appUser as User;
  },
);
