import { CACHE_MANAGER, forwardRef, Inject, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Cache } from 'cache-manager';
import { nanoid } from "nanoid";
import { Socket } from "socket.io";
import { ClientListener, EventsGateway } from "src/events/events.gateway";
import { Lobby, LobbyStatus } from "./dto/lobby.dto";
import { Player } from "./dto/player.dto";

@Injectable()
export class LobbyStoreService {

    constructor (
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @Inject(forwardRef(() => EventsGateway)) private eventsGateway: EventsGateway
    ) {}

    // buildId(id: string) { return `room-${id}` }

    // async startNewLobby (lobbyId: string, players: Player[]): Promise<Lobby> {
    //     const lobby: Lobby = {
    //         id: lobbyId,
    //         status: LobbyStatus.NotStartedYet,
    //         players: players.map(player => player.id)
    //     }

    //     const builtId = this.buildId(lobbyId);
    //     await this.cacheManager.set(builtId, lobby);

    //     return lobby;
    // }

    // async getLobby (lobbyId): Promise<Lobby> {
    //     return this.cacheManager.get(lobbyId);
    // }

    // async deleteRoom(roomId: string) {
	// 	await this.eventsGateway.server.in(roomId).socketsLeave(roomId)
	// 	const sockets = await this.eventsGateway.server.in(roomId).fetchSockets();
	// 	for (let socket of sockets) {
	// 		const player = await this.gameService.getPlayer(socket.id);
	// 		this.gameService.updatePlayerRoom(player, null);
	// 	}
	// }

	// checkIfRoomExists(roomId: string): boolean {
	// 	return !!this.eventsGateway.server.sockets.adapter.rooms.get(roomId);
	// }

	// generateRandomRoomId(): string { // Incomplete
	// 	for (let i = 15; i > 0; i--) {
	// 		const random_id = nanoid(10);
	// 		if (!this.checkIfRoomExists(random_id)) {
	// 			return random_id;
	// 		}
	// 	}
	// }

    // async leaveRoom (player: Player, client: Socket) {
	// 	// If client didnt get name
	// 	if (!player) {
	// 		throw new WsException('Client not registered');
	// 	}

	// 	// If client already created room
	// 	if (player.playingRoomId) {

	// 		if (player.isHost) { // Is host in room
	// 			client.emit(ClientListener.log, 'Client is host of a room. Room deleted');

	// 			this.eventsGateway
    //                 .server
    //                 .to(player.playingRoomId)
    //                 .emit(ClientListener.session, this.gameService.emptyRoom);
	// 			this
    //                 .eventsGateway
    //                 .server
    //                 .to(player.playingRoomId)
    //                 .emit(ClientListener.lobby, `Host ${player.nickname} disconnect from room`);

	// 			await this.deleteRoom(player.playingRoomId);

	// 		} else { // Inst host in room

	// 			client
    //                 .emit(ClientListener.log, 'Client already in some room. Left client from room.');

	// 			this.eventsGateway
    //                 .server
    //                 .to(player.playingRoomId)
    //                 .emit(ClientListener.lobby, `${player.nickname} disconnected`);

	// 			await client.leave(player.playingRoomId);
	// 		}
	// 	}
	// }

}