import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @Length(1, 2000)
  answerText!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2048)
  photoUrl?: string;
}
