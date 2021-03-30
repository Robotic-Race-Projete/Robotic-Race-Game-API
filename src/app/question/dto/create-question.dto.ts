import { Prisma, QuestionCategory } from "@prisma/client";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsString, Min, MinLength, Validate, ValidateNested } from "class-validator";
import { AnswerDto } from "./answer.dto";

const questionCategoryString: string[] = [];
for (let enumMember in QuestionCategory) {
    questionCategoryString.push(enumMember);
}

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    question: string;

    @IsNotEmpty()
    @IsEnum(QuestionCategory, {
        message: `category must be a valid enum value: ${questionCategoryString.join(', ')}`
    })
    category: QuestionCategory

    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(8)
    @ArrayMinSize(2)
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers: AnswerDto[];
}
