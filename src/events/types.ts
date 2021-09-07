interface Person {
    id: number;
    room_id: number;
    nickname: string;
    canPlay: boolean;
}

interface GameRoom {
    id: number;
    persons_ids: number[];
}