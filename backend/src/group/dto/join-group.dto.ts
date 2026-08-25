import { IsString, Length } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @Length(1, 20)
  inviteCode!: string;
}
