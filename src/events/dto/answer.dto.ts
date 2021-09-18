import { IsNumber } from "class-validator";

export class PlayerAnswerDto {
    @IsNumber()
    question_id: number;

    @IsNumber()
    answer_id: number;
}