import {
	forwardRef,
	Inject,
	Logger,
	UseFilters,
	UsePipes,
	ValidationPipe,
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
	WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BadRequestTransformationFilter } from 'src/common/filters/bad-request-transformer.filter';
import { ConnectDto } from './dto/connect.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { GameService } from 'src/game/game.service';
import { Lobby, Player } from '@prisma/client';

export enum ClientListener {
	exception = 'exception',
	log = 'log',
	session = 'session',
	lobby = 'lobby',
	game_feed = 'game_feed',
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
export class EventsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	logger = new Logger(EventsGateway.name);

	@WebSocketServer()
	server: Server;

	constructor(
		@Inject(forwardRef(() => GameService)) private gameService: GameService,
	) {}

	/**
	 * Create room session for other players
	 */
	@SubscribeMessage(ServerListener.createRoom)
	async handleRoomCreate(@ConnectedSocket() client: Socket) {
		const player = await this.gameService.getPlayer(client.id);

		if (player) {
			// Check if player in some lobby
			const possibleEnteredLobby = await this.gameService.getPlayerLobby(player);
			if (possibleEnteredLobby != null) {
				client.emit(
					ClientListener.exception, 
					`Client is already in a room. Room id: ${possibleEnteredLobby.id}`
				);
				this.updateSocketRooms(client, player, possibleEnteredLobby, null);
			}

			const newLobby = await this.gameService.createLobby(player);

			this.updateSocketRooms(client, player, null, newLobby);
		} else {
			client.emit(ClientListener.exception, 'You need to sign in to create a room!')
		}
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
		const lobbyWantToJoin = await this.gameService.getLobby(data.room_id);

		if (player && lobbyWantToJoin) {
			const oldLobby = await this.gameService.getPlayerLobby(player);
			const updatedLobby = await this.gameService.changeLobby(
				player,
				lobbyWantToJoin,
			);

			this.updateSocketRooms(
				client,
				player,
				oldLobby,
				updatedLobby,
			);
		} else {
			if (!player) {
				client.emit(ClientListener.exception, 'You need to sign in to join a room!')
			}
			if (!lobbyWantToJoin) {
				client.emit(ClientListener.exception, `The lobby ${data.room_id} doesn't exist`);
			}
		}
	}

	/**
	 * When a client decides to exit a room
	 */
	@SubscribeMessage(ServerListener.exitRoom)
	async handleExitLobby(@ConnectedSocket() client: Socket) {
		const player = await this.gameService.getPlayer(client.id);

		if (player) {
			const possibleEnteredLobby = await this.gameService.exitLobby(player);
			if (possibleEnteredLobby) {
				const updatedLobby = await this.gameService.getLobby(possibleEnteredLobby.id);
				this.updateSocketRooms(client, player, updatedLobby, null);
			}
		} else {
			client.emit(ClientListener.exception, 'You need to sign in to exit a room!');
		}
	}

	/**
	 * Save client's player settings
	 */
	@SubscribeMessage(ServerListener.startSession)
	async handleEnterGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: ConnectDto,
	) {
		const checkPlayer = await this.gameService.getPlayer(client.id);

		if (checkPlayer) {
			client.emit(ClientListener.exception, 'You already logged in! Disconnect to change nickname')
		} else {
			const player = await this.gameService.addPlayer(data.nickname, client);
			client.emit(ClientListener.log, player);
		}
	}

	/**
	 * Channel where the players sends the messages
	 */
	@SubscribeMessage(ServerListener.giveAnswer)
	async handleGivenAnswer(@ConnectedSocket() client: Socket): Promise<any> {}

	emitToLobby(lobby: Lobby, event: ClientListener, msg: any) {
		this.server.to(lobby.id).emit(event, msg);
	}

	afterInit() {
		const onRoomsChanged = () => {
			const keys = this.server.sockets.adapter.rooms.keys();
			this.logger.log(`Rooms: ${[...keys].join(', ')}`);
		};

		this.server.sockets.adapter.on('create-room', onRoomsChanged);
		this.server.sockets.adapter.on('delete-room', onRoomsChanged);
	}

	/**
	 * Should run before any database update
	 */
	private updateSocketRooms(
		client: Socket,
		player: Player,
		oldRoomLeft: Lobby|null,
		newRoomJoined: Lobby|null,
	) {
		console.log(oldRoomLeft, newRoomJoined);
		if (!client) return;

		if (oldRoomLeft) {
			client.leave(oldRoomLeft.id);

			this.server
				.to(oldRoomLeft.id)
				.emit(ClientListener.lobby, `Player ${player.nickname} left`);

			this.emitToLobby(
				oldRoomLeft,
				ClientListener.session,
				oldRoomLeft,
			);
		}

		if (newRoomJoined) {
			this.server
				.to(newRoomJoined.id)
				.emit(ClientListener.lobby, `Player ${player.nickname} joined`);

			client.join(newRoomJoined.id);

			this.emitToLobby(
				newRoomJoined,
				ClientListener.session,
				newRoomJoined,
			);
		}
	}

	async handleConnection(@ConnectedSocket() client: Socket) {}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
		const player = await this.gameService.getPlayer(client.id);
		if (player) {
			const exitedLobby = await this.gameService.exitLobby(player);
			if (exitedLobby) {
				const updatedLobby = await this.gameService.getLobby(exitedLobby.id);
				this.updateSocketRooms(client, player, updatedLobby, null);
			}
			await this.gameService.deletePlayer(player)
		};
	}
}
