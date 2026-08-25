import { Injectable } from '@nestjs/common';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private app: App | undefined;

  verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return getAuth(this.getApp()).verifyIdToken(idToken);
  }

  private getApp(): App {
    if (!this.app) {
      this.app = getApps()[0] ?? this.initializeApp();
    }
    return this.app;
  }

  private initializeApp(): App {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}
