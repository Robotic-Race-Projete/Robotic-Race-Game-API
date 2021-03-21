import { Exclude } from "class-transformer";
import { isAscii, IsEmail, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    @Matches(/[A-Z]/i, { message: "password must contain a capitalized letter" })
    @Matches(/[0-9]/i, { message: "password must contain a number" })
    @Matches(/[^a-zA-Z0-9]/i, { message: "password must contain a special caracter" })
    @Exclude({ toPlainOnly: true })
    password: string

    @IsString()
    @MinLength(4)
    @MaxLength(40)
    @Matches(/^[\w\-]+$/i)
    username: string
}
