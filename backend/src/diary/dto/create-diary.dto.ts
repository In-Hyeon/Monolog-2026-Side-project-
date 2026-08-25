import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateDiaryDto {
  @IsIn(['quick', 'full'])
  entryType!: 'quick' | 'full';

  @IsString()
  @Length(1, 10000)
  content!: string;

  @IsOptional()
  @IsString()
  @Length(0, 16)
  emoji?: string;

  @IsIn(['private', 'public', 'group'])
  privacyScope!: 'private' | 'public' | 'group';

  @IsOptional()
  @IsUUID()
  promptId?: string;

  /** privacyScope가 group일 때만 사용된다. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  groupIds?: string[];
}
