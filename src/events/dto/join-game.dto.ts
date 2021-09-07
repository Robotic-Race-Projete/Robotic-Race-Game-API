import { IsAlphanumeric, IsNotEmpty, IsNumber, IsString, Length, Max } from "class-validator";

export class JoinGameDto {
    @IsNumber()
    @IsNotEmpty()
    game_id: number;
}