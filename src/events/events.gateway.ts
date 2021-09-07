import {
	CACHE_MANAGER,
	Inject,
	Injectable,
	Logger,
	Scope,
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
	WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'dgram';
import { Server } from 'socket.io';
import { BadRequestTransformationFilter } from 'src/common/filters/bad-request-transformer.filter';
import { GameService } from 'src/game/game.service';
import { ConnectDto } from './dto/connect.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { Cache } from 'cache-manager';

@UseFilters(new BadRequestTransformationFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway(3050)
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private logger = new Logger('Loaded');

	gameService: GameService;
	constructor (@Inject(CACHE_MANAGER) private cacheManager: Cache) {
		new GameService(cacheManager);
	}

	/**
	 * When a player joins another player's game session
	 */
	@SubscribeMessage('join_game')
	handleJoinEvent(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinGameDto,
	): WsResponse<string> {
		return { event: 'game', data: 'asdasd' };
	}

	/**
	 * Save client's player settings
	 */
	@SubscribeMessage('enter_game')
	handleEnterGame(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: ConnectDto,
	): WsResponse<string> {
		return { event: 'game', data: 'a' }
	}

	afterInit() {}

	handleConnection(client: Socket) {}

	handleDisconnect(client: Socket) {}
}
