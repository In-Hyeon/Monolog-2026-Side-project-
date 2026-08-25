import { IsOptional, IsString, Length } from 'class-validator';

export class UpsertUserProfileDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2048)
  profileImage?: string;
}
