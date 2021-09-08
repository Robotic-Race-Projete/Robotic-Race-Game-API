export class Player {
    nickname: string;
    socketId: string;
    playingRoomId: string | null;
    isHost: boolean;
}

export class PlayerDto {
    nickname: string;
    playingRoomId: string | null;
}