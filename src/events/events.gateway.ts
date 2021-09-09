import {
	forwardRef,
	Inject,
	Logger,
	UseFilters,
	UsePipes,
	ValidationPipe
} from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
	WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BadRequestTransformationFilter } from 'src/common/filters/bad-request-transformer.filter';
import { PlayerStoreService } from 'src/game/player-store.service';
import { ConnectDto } from './dto/connect.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { Player } from 'src/game/dto/player.dto';
import { RoomDto } from 'src/game/dto/room.dto';
import { nanoid } from 'nanoid';

export enum ClientListener {
	exception = 'exception',
	log = 'log',
	session = 'session',
	lobby = 'lobby',
	game_feed = 'game_feed'
}

@UseFilters(new BadRequestTransformationFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway(3050)
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	logger = new Logger(EventsGateway.name);

	@WebSocketServer()
	server: Server;

	constructor (
		@Inject(forwardRef(() => PlayerStoreService)) private gameService: PlayerStoreService
	) {}

	async deleteRoom(roomId: string) {
		await this.server.in(roomId).socketsLeave(roomId)
		const sockets = await this.server.in(roomId).fetchSockets();
		for (let socket of sockets) {
			const player = await this.gameService.getPlayer(socket.id);
			this.gameService.updatePlayerRoom(player, null);
		}
	}

	checkIfRoomExists(roomId: string): boolean {
		return !!this.server.sockets.adapter.rooms.get(roomId);
	}

	generateRandomRoomId(): string { // Incomplete
		for (let i = 15; i > 0; i--) {
			const random_id = nanoid(10);
			if (!this.checkIfRoomExists(random_id)) {
				return random_id;
			}
		}
	}

	async leaveRoom (player: Player, client: Socket) {
		// If client didnt get name
		if (!player) {
			throw new WsException('Client not registered');
		}

		// If client already created room
		if (player.playingRoomId) {

			if (player.isHost) { // Is host in room
				client.emit(ClientListener.log, 'Client is host of a room. Room deleted');

				this.server.to(player.playingRoomId).emit(ClientListener.session, this.gameService.emptyRoom);
				this.server.to(player.playingRoomId).emit(ClientListener.lobby, `Host ${player.nickname} disconnect from room`);

				await this.deleteRoom(player.playingRoomId);
			} else { // Inst host in room
				client.emit(ClientListener.log, 'Client already in some room. Left client from room.');

				this.server.to(player.playingRoomId).emit(ClientListener.lobby, `${player.nickname} disconnected`);

				await client.leave(player.playingRoomId);
			}
		}
	}

	/**
	 * Create room session for other players
	 */
	@SubscribeMessage('create_room')
	async handleRoomCreate(
		@ConnectedSocket() client: Socket
	): Promise<WsResponse<RoomDto>> {
		const player = await this.gameService.getPlayer(client.id);

		await this.leaveRoom(player, client); // if player already created room or is in one

		const random_id = this.generateRandomRoomId();
		const room = await this.gameService.roomCreatedByHost(player, random_id);
		client.join(room.roomId);

		return { event: ClientListener.session, data: room };
	}

	/**
	 * When a player joins another player's game session
	 */
	@SubscribeMessage('join_room')
	async handleJoinEvent(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinGameDto,
	): Promise<WsResponse<RoomDto>> {
		const player = await this.gameService.getPlayer(client.id);
		
		await this.leaveRoom(player, client);

		// If room doesnt exists
		if (!this.checkIfRoomExists(data.room_id)) {
			throw new WsException(`Room ${data.room_id} doesn't exist`);
		}

		this.server.to(data.room_id).emit(ClientListener.lobby, `${player.nickname} joined`)
		client.join(data.room_id);
		const room = await this.gameService.updatePlayerRoom(player, data.room_id);

		return { event: ClientListener.session, data: room }
	}

	/**
	 * When a client decides to exit a room
	 */
	@SubscribeMessage('exit_room')
	async handleExitLobby(
		@ConnectedSocket() client: Socket
	): Promise<WsResponse<RoomDto>> {
		const player = await this.gameService.getPlayer(client.id);

		await this.leaveRoom(player, client);
		const room = await this.gameService.updatePlayerRoom(player, null);

		return { event: ClientListener.session, data: room }
	}

	/**
	 * Save client's player settings
	 */
	@SubscribeMessage('start_session')
	async handleEnterGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: ConnectDto,
	): Promise<WsResponse<Player>> {
		const id = await this.gameService.addPlayer(data.nickname, client);
		const player = await this.gameService.getPlayer(client.id);
		return { event: ClientListener.log, data: player }
	}

	/**
	 * Channel where the players sends the messages
	 */
	@SubscribeMessage('answer')
	async handleGivenAnswer(
		@ConnectedSocket() client: Socket
	): Promise<any> {

	}


	afterInit() {
		const onRoomsChanged = () => {
			const roomNames = []
			for (let entry of this.server.sockets.adapter.rooms.entries()) {
				roomNames.push(entry[0]);
			}
			this.logger.log(`Rooms: ${roomNames.join(', ')}`);
		}

		this.server.sockets.adapter.on('create-room', onRoomsChanged);
		this.server.sockets.adapter.on('delete-room', onRoomsChanged);
	}

	async handleConnection(client: Socket) {}

	async handleDisconnect(client: Socket) {
		try {
			const player = await this.gameService.getPlayer(client.id);

			await this.leaveRoom(player, client);
			this.gameService.deletePlayer(player.id)
		} catch {}
	}
}
