import {
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
import { GameService } from 'src/game/game.service';
import { ConnectDto } from './dto/connect.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { Player } from 'src/game/dto/player.dto';
import { RoomDto } from 'src/game/dto/room.dto';
import { nanoid } from 'nanoid';

@UseFilters(new BadRequestTransformationFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway(3050)
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	logger = new Logger(EventsGateway.name);

	@WebSocketServer()
	server: Server;

	constructor (private gameService: GameService) {}

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

	async leaveRoomIfPlayerDiscOrChangeRoom (player: Player, client: Socket) {
		// If client didnt get name
		if (!player) {
			throw new WsException('Client not registered');
		}

		// If client already created room
		if (player.playingRoomId) {

			if (player.isHost) { // Is host in room
				client.emit('exception', 'Client is host of a room. Room deleted');

				this.server.to(player.playingRoomId).emit('log', `Host ${player.nickname} disconnect from room`);
				this.server.to(player.playingRoomId).emit('session', this.gameService.emptyRoom);

				await this.deleteRoom(player.playingRoomId);
			} else { // Inst host in room
				client.emit('exception', 'Client already in some room. Left client from room.');

				this.server.to(player.playingRoomId).emit('log', `${player.nickname} disconnected`);

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

		await this.leaveRoomIfPlayerDiscOrChangeRoom(player, client);

		const random_id = this.generateRandomRoomId();
		const room = await this.gameService.roomCreatedByHost(player, random_id);
		client.join(room.roomId);

		return { event: 'session', data: room };
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
		
		await this.leaveRoomIfPlayerDiscOrChangeRoom(player, client);

		// If room doesnt exists
		if (!this.checkIfRoomExists(data.room_id)) {
			throw new WsException(`Room ${data.room_id} doesn't exist`);
		}

		this.server.to(data.room_id).emit('log', `${player.nickname} joined`)
		client.join(data.room_id);
		const room = await this.gameService.updatePlayerRoom(player, data.room_id);

		return { event: 'log', data: room }
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
		return { event: 'log', data: player }
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

	handleConnection(client: Socket) {}

	async handleDisconnect(client: Socket) {
		try {
			const player = await this.gameService.getPlayer(client.id);

			await this.leaveRoomIfPlayerDiscOrChangeRoom(player, client);
			this.gameService.deletePlayer(player.socketId)
		} catch {}
	}
}
