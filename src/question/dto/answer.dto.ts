import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class AnswerDto {

    @IsString()
    answer: string;

    @IsBoolean()
    isRight: boolean;
}
