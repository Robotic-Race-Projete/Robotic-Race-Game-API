import { IsAlphanumeric, IsBoolean, IsString, Length } from "class-validator";

export class ConnectDto {
    @IsString()
    @Length(4, 16)
    @IsAlphanumeric()
    nickname: string;
}