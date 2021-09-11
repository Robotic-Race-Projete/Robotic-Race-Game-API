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
import { ConnectDto } from './dto/connect.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { nanoid } from 'nanoid';
import { GameService } from 'src/game/game.service';
import { Lobby, Player } from '@prisma/client';

export enum ClientListener {
	exception = 'exception',
	log = 'log',
	session = 'session',
	lobby = 'lobby',
	game_feed = 'game_feed'
}

export enum ServerListener {
	startSession = 'start_session',
	createRoom = 'create_room',
	joinRoom = 'join_room',
	exitRoom = 'exit_room',
	giveAnswer = 'answer',
}

@UseFilters(new BadRequestTransformationFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway(3050)
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	logger = new Logger(EventsGateway.name);

	@WebSocketServer()
	server: Server;

	constructor (
		@Inject(forwardRef(() => GameService)) private gameService: GameService
	) {}

	/**
	 * Create room session for other players
	 */
	@SubscribeMessage(ServerListener.createRoom)
	async handleRoomCreate(
		@ConnectedSocket() client: Socket
	) {
		const player = await this.gameService.getPlayer(client.id);
		const lobby = await this.gameService.createOrUpdateLobby(player);

		this.emitToLobby(lobby, ClientListener.session, lobby);
;
		// return { event: ClientListener.session, data: lobby.Lobby };
	}

	/**
	 * When a player joins another player's game session
	 */
	@SubscribeMessage(ServerListener.joinRoom)
	async handleJoinEvent(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinGameDto,
	) {
		const player = await this.gameService.getPlayer(client.id);
		const lobby = await this.gameService.getLobby(data.room_id);
		if (player && lobby) {
			const updatedLobby = await this.gameService.createOrUpdateLobby(player, lobby);

			this.emitToLobby(lobby, ClientListener.session, updatedLobby);
		}

		// return { event: ClientListener.session, data: lobby }
	}

	/**
	 * When a client decides to exit a room
	 */
	@SubscribeMessage(ServerListener.exitRoom)
	async handleExitLobby(
		@ConnectedSocket() client: Socket
	) {
		const player = await this.gameService.getPlayer(client.id);

		const lobby = await this.gameService.deleteLobbyConnection(player);

		this.emitToLobby(lobby, ClientListener.session, lobby);

		// return { event: ClientListener.session, data: null }
	}

	/**
	 * Save client's player settings
	 */
	@SubscribeMessage(ServerListener.startSession)
	async handleEnterGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: ConnectDto,
	): Promise<WsResponse<Player>> {
		const player = await this.gameService.addPlayer(data.nickname, client);
		return { event: ClientListener.log, data: player }
	}

	/**
	 * Channel where the players sends the messages
	 */
	@SubscribeMessage(ServerListener.giveAnswer)
	async handleGivenAnswer(
		@ConnectedSocket() client: Socket
	): Promise<any> {

	}

	emitToLobby (lobby: Lobby & { id }, event: ClientListener, msg: any) {
		this.server.to(lobby.id).emit(event, msg);
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
		const player = await this.gameService.getPlayer(client.id);
		if (player)
			this.gameService.deletePlayer(player);
	}
}
