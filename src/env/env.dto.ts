import { ParseIntPipe } from "@nestjs/common"
import { Transform, Type } from "class-transformer"
import { IsNumber, IsNumberString, IsString } from "class-validator"

export class DotEnv {
    @Transform(({ value }) => Number(value), { toClassOnly: true } )
    @IsNumber()
    DB_PORT: number

    @IsString()
    DB_USERNAME: string

    @IsString()
    DB_PASSWORD: string

    @IsString()
    DB_DATABASE: string

    @IsString()
    DB_HOST: string

    @IsString()
    DATABASE_URL: string

    // @IsString()
    // BCRYPT_HASH_KEY: string

    @Transform(({ value }) => Number(value), { toClassOnly: true } )
    @IsNumber()
    BCRYPT_SALT_ROUNDS: number

    @IsString()
    JWT_SECRET: string
}