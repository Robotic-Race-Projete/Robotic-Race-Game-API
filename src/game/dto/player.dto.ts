export class Player {
	id: string;
	nickname: string;
	playingRoomId: string | null;
	isHost: boolean;
}

export class PlayerDto {
	nickname: string;
	playingRoomId: string | null;
}
