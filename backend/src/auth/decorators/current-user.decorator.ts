import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): DecodedIdToken => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as DecodedIdToken;
  },
);
