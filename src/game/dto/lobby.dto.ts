export enum LobbyStatus {
    Playing,
    NotStartedYet
}

export class PlayerStatusInLobby {
    player_id: string;
    isReady: boolean;
}

export class Lobby {
    id: string;
    status: LobbyStatus;
    players: string[];
}