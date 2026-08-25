import { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      appUser?: User;
    }
  }
}
