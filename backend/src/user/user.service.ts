import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertUserProfileDto } from './dto/upsert-user-profile.dto';

export type PublicUserProfile = Pick<
  User,
  'id' | 'name' | 'profileImage' | 'createdAt'
>;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  upsertProfile(
    firebaseUid: string,
    email: string,
    dto: UpsertUserProfileDto,
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { firebaseUid },
      update: { name: dto.name, profileImage: dto.profileImage },
      create: {
        firebaseUid,
        email,
        name: dto.name,
        profileImage: dto.profileImage,
      },
    });
  }

  async findMe(firebaseUid: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (!user) {
      throw new NotFoundException(
        '아직 등록되지 않은 사용자입니다. 프로필을 먼저 등록해주세요.',
      );
    }
    return user;
  }

  async findPublicProfile(id: string): Promise<PublicUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, profileImage: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }
}
