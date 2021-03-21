import { Exclude } from "class-transformer";
import { IsEmail, IsNumber, IsString, ValidateIf } from "class-validator";

export class AdminAuth {
    @IsString()
    nickname: string

    @Exclude({ toPlainOnly: true })
    @IsString()
    password: string
}