import { IsBoolean } from "class-validator";

export class ReadyUpDto {
    @IsBoolean()
    value: boolean
}