import { Exclude } from "class-transformer"
import { IsNotEmpty, IsString } from "class-validator"

export class AdminCredentialsDto {
    @IsNotEmpty()
    @IsString()
    nickname: string

    // @Exclude({ toClassOnly: true })
    @IsNotEmpty()
    @IsString()
    password: string
}