import { IsNotEmpty, IsNumber, isNumber, IsOptional, Min } from "class-validator";

export class QuestionRangeDto {
    @IsOptional()
    @IsNumber()
    startingIndex: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Min(100)
    howMany: number;
}