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
import { GameConfigurationService } from 'src/game/gameConfig.service';
import { QuestionService } from 'src/app/question/question.service';
import { AnswerDto } from 'src/app/question/dto/answer.dto';
import { PlayerAnswerDto } from './dto/answer.dto';
import { ReadyUpDto } from './dto/ready-up.dto';

export enum ClientListener {
	exception = 'exception', // for validation and server errors 
	log = 'log', // logging staff
	session = 'session', // account related
	lobby = 'lobby', // lobby state
	game_feed = 'game_feed', // game feed - notify user
	question = 'question', // channel to send questions
	statusAtLobby = 'status_at_lobby' // status of a at lobby
}

export enum ServerListener {
	startSession = 'start_session',
	createRoom = 'create_room',
	joinRoom = 'join_room',
	exitRoom = 'exit_room',
	ready_up = 'ready_up',
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
		private gameConfig: GameConfigurationService,
		// @Inject(forwardRef(() => QuestionService))
		private questionService: QuestionService
	) {}

	/**
	 * Create room session for other players
	 */
	@SubscribeMessage(ServerListener.createRoom)
	async handleRoomCreate(@ConnectedSocket() client: Socket) {
		const player = await this.validateClient(client, 'You need to sign in to create a room!');

		// Get possible lobby
		const possibleEnteredLobby = await this.gameService.getPlayerLobby(player);

		// Validation
		const aPossibleError = this.gameConfig.checkCreateLobbyConstrainst({
			checkLobby: possibleEnteredLobby
		})
		this.onValidationError(client, aPossibleError);

		const newLobby = await this.gameService.createLobby(player);

		this.updateSocketRooms(client, player, null, newLobby);
	}

	/**
	 * When a player joins another player's game session
	 */
	@SubscribeMessage(ServerListener.joinRoom)
	async handleJoinEvent(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinGameDto,
	) {
		const player = await this.validateClient(client, 'You need to sign in to join a room!');
		const lobbyWantToJoin = await this.gameService.getLobby(data.room_id);
		if (lobbyWantToJoin) {
			// Validation
			const aPossibleError = this.gameConfig.checkJoinLobbyConstraints({
				playersAtLobby: lobbyWantToJoin.Players,
				lobby: lobbyWantToJoin
			});
			this.onValidationError(client, aPossibleError);

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
			client.emit(ClientListener.exception, `The lobby ${data.room_id} doesn't exist`);
		}
	}

	/**
	 * When a client decides to exit a room
	 */
	@SubscribeMessage(ServerListener.exitRoom)
	async handleExitLobby(@ConnectedSocket() client: Socket) {
		const player = await this.validateClient(client, 'You need to sign in to exit a room!');

		const possibleEnteredLobby = await this.gameService.exitLobby(player);
		if (possibleEnteredLobby) {
			const lobby = possibleEnteredLobby;
			
			// Does others validations
			const aPossibleError = this.gameConfig.checkExitLobbyConstrainst({
				lobby
			});
			this.onValidationError(client, aPossibleError);

			const updatedLobby = await this.gameService.getLobby(lobby.id);
			this.updateSocketRooms(client, player, updatedLobby, null);
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
			if (player) {
				client.emit(ClientListener.session, player);
			}
		}
	}

	/**
	 * Channel where the players sends the messages
	 */
	@SubscribeMessage(ServerListener.giveAnswer)
	async handleGivenAnswer(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: PlayerAnswerDto
	): Promise<any> {
		const player = await this.validateClient(client);
		const lobby = await this.gameService.getPlayerLobby(player);

		if (lobby) {
			const is_right = await this.gameService.checkAnswer(
				data.answer_id, data.question_id, lobby
			);

			if (is_right) {
				this.gameService.giveScoreToPlayer(player, 100);
				client.emit(ClientListener.game_feed, 'You answered correctly!');
			} else {
				client.emit(ClientListener.game_feed, 'You missed!');
			}
		}
	}

	/**
	 * When player ready up on lobby
	 */
	@SubscribeMessage(ServerListener.ready_up)
	async handleReadyUp (
		@ConnectedSocket() client: Socket,
		@MessageBody() data: ReadyUpDto,
	) {
		const player = await this.validateClient(client);
		const playerAtLobby = await this.gameService.makePlayerReady(player, data.value);

		if (playerAtLobby) {
			const lobby = playerAtLobby.Lobby;

			// send update to sockets
			client.emit(ClientListener.statusAtLobby, playerAtLobby);
			this.emitToLobby(lobby, ClientListener.lobby, lobby);
			
			if (!lobby.Players.find(p => (p.isReady == false))) {
				
				const aPossibleError = this.gameConfig.checkStartGameConstraints({
					lobby,
					playersAtLobby: lobby.Players
				});
				this.onValidationError(client, aPossibleError);
				
				const updatedLobby = await this.gameService.startGame(lobby, async (next) => {
					await this.questionCycleOnGameStart(next, lobby);
				});
				this.emitToLobby(updatedLobby, ClientListener.lobby, updatedLobby);
			}
		}

	}

	async questionCycleOnGameStart(next, lobby: Lobby) {
		const question = await this.gameService.generateRandomQuestion(lobby);
		this.emitToLobby(lobby, ClientListener.question, question);
	}

	onValidationError(client: Socket, error: string|null) {
		if (error) {
			client.emit(ClientListener.game_feed, error);
			throw new WsException(error);
		}
	}

	emitToLobby(lobby: Lobby, event: ClientListener, msg: any) {
		this.server.to(lobby.id).emit(event, msg);
	}

	async validateClient (
		client: Socket, 
		textOnError = 'You need to sign in before doing this action!'
	): Promise<Player>|never {
		const possiblePlayer = await this.gameService.getPlayer(client.id);
		if (possiblePlayer) {
			return possiblePlayer
		} else {
			throw new WsException(textOnError);
		}
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
		if (!client) return;

		if (oldRoomLeft) {
			client.leave(oldRoomLeft.id);

			this.server
				.to(oldRoomLeft.id)
				.emit(ClientListener.game_feed, `Player ${player.nickname} left`);

			this.emitToLobby(
				oldRoomLeft,
				ClientListener.lobby,
				oldRoomLeft,
			);
		}

		if (newRoomJoined) {
			this.server
				.to(newRoomJoined.id)
				.emit(ClientListener.game_feed, `Player ${player.nickname} joined`);

			client.join(newRoomJoined.id);

			this.emitToLobby(
				newRoomJoined,
				ClientListener.lobby,
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
