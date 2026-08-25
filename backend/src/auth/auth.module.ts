import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AppUserGuard } from './guards/app-user.guard';

@Global()
@Module({
  providers: [FirebaseAdminService, FirebaseAuthGuard, AppUserGuard],
  exports: [FirebaseAdminService, FirebaseAuthGuard, AppUserGuard],
})
export class AuthModule {}
