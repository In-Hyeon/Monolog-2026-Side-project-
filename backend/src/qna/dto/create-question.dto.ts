import { IsOptional, IsString, Length } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @Length(1, 2000)
  questionText!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2048)
  photoUrl?: string;
}
