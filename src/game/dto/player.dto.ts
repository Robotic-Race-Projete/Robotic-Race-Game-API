import { Socket } from "dgram";

export class Player {
    nickname: string;
    client: Socket;
    playingRoomId: number | null;
}