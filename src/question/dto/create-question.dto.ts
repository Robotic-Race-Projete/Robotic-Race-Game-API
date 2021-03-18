import { IsString, ValidateNested } from "class-validator";
import { AnswerDto } from "./answer.dto";

export class CreateQuestionDto {
    @IsString()
    question: string;

    @ValidateNested()
    answers: AnswerDto[];
}
