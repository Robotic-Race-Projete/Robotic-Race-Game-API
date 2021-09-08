import { IsAlphanumeric, IsNotEmpty, IsNumber, IsString, Length, Max } from "class-validator";

export class JoinGameDto {
    @IsString()
    @IsNotEmpty()
    room_id: string;
}