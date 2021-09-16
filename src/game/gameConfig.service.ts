import { Injectable } from "@nestjs/common";
import { Lobby, Player, PlayerAtLobby } from "@prisma/client";

@Injectable()
export class GameConfigurationService {
    
    maxPlayerPerLobby = 2;

    checkJoinLobbyConstraint(players: PlayerAtLobby[]) {
        return players.length >= this.maxPlayerPerLobby;
    }

}