import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsString, Min, MinLength, Validate, ValidateNested } from "class-validator";
import { AnswerDto } from "./answer.dto";

export class CreateQuestionDto {
    @IsString()
    question: string;

    @IsArray()
    @ArrayMaxSize(8)
    @ArrayMinSize(2)
    @ValidateNested()
    answers: AnswerDto[];
}
