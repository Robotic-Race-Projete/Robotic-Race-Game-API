import { Exclude } from "class-transformer";
import { IsEmail, IsString, ValidateIf } from "class-validator";

export class UserAuth {
    @IsEmail()
    email: string|undefined

    @Exclude({ toPlainOnly: true })
    @IsString()
    password: string
}