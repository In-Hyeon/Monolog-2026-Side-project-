import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateDiaryDto {
  @IsOptional()
  @IsString()
  @Length(1, 10000)
  content?: string;

  @IsOptional()
  @IsString()
  @Length(0, 16)
  emoji?: string;

  /** group으로 변경하려면 diary 공유 API(추후 추가 예정)를 사용해야 한다. */
  @IsOptional()
  @IsIn(['private', 'public'])
  privacyScope?: 'private' | 'public';
}
