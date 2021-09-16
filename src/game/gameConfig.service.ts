import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Lobby, Player, PlayerAtLobby, Prisma } from "@prisma/client";
import { Socket } from "socket.io";
import { ClientListener } from "src/events/events.gateway";

@Injectable()
export class GameConfigurationService {
    
    maxPlayerPerLobby = 2;
    
    checkExitLobbyConstrainst(
        param: {
            lobby: Lobby
        }
    ) {
        const { lobby } = param;

        if (lobby.isOnMatch) {
            return "Can't exit lobby while in match (unless you disconnect)";
        }

        return null
    }

    checkJoinLobbyConstraints(
        param: {
            playersAtLobby: PlayerAtLobby[],
            lobby: Lobby
        }
    ): string|null {
        const { playersAtLobby, lobby } = param;

        if (lobby.isOnMatch) {
            return 'Lobby already started!';
        }

        if (playersAtLobby.length >= this.maxPlayerPerLobby) {
            return 'Lobby hit max player allowed.';
        }

        return null;
    }

    checkCreateLobbyConstrainst(
        param: {
            checkLobby: Lobby|null
        }
    ) {
        const { checkLobby } = param;

        if (checkLobby) {
            return `Client is already in a room. Room id: ${checkLobby.id}`
        }

        return null;
    }
}