import {
	CACHE_MANAGER,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	OnModuleInit,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Lobby, Player, PlayerAtLobby, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { Socket } from 'socket.io';
import { ClientListener, EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';


const LobbySelector = {
	Lobby: {
		include: {
			Players: {
				select: {
					isReady: true,
					Player: {
						select: { nickname: true, createdAt: true },
					},
				},
			},
		},
	},
}


@Injectable()
export class GameService implements OnModuleInit {
	logger = new Logger(GameService.name);

	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => EventsGateway))
		private eventsGateway: EventsGateway,
	) {}

	async onModuleInit() {
		// await this.prismaService
		//     .$executeRaw(`TRUNCATE TABLE ${Prisma.ModelName.Player} RESTART IDENTITY CASCADE;`);
	}

	async addPlayer(nickname: string, client: Socket): Promise<Player> {
		const checkPlayer = await this.prismaService.player.findFirst({
			where: { socketId: client.id },
		});

		if (checkPlayer)
			throw new WsException(
				'You already logged in! Disconnect to change nickname',
			);

		const player = await this.prismaService.player.create({
			data: {
				nickname,
				socketId: client.id,
			},
		});

		await this.updateSocketRooms(player, null); // Updates sockets rooms

		return player;
	}

	async changePlayer(socketId: string, player: Player) {
		throw new Error('not implemented');
	} // danger

	async getPlayer(socketId: string): Promise<Player> {
		return await this.prismaService.player.findUnique({
			where: { socketId },
			include: {
				LobbyConnection: true,
			},
		});
	}

	async deletePlayer(player: Player) {
		if (player.LobbyConnectionId)
			await this.deleteLobbyConnection(player);
		return await this.prismaService.player.delete({
			where: {
				id: player.id,
			},
		});
	}

	async createOrUpdateLobby(player: Player, lobbyToJoin: Lobby|null = null): Promise<Lobby> {
		if (!player) throw new WsException('Client not logged in');

		const id =  lobbyToJoin?.id || nanoid(10);
		const lobby = lobbyToJoin 
		? ({ connect: { id } })
		: ({ create: { id } });

		await this.updateSocketRooms(player, id); // Updates sockets rooms

		const lobbyConnection = await this.prismaService.playerAtLobby.create({
			data: {
				isReady: false,

				Player: {
					connect: { socketId: player.socketId },
				},
				Match: {
					create: {
						score: 0,
						answeredQuestions: 0,
					},
				},
				Lobby: lobby,
			},
			select: LobbySelector,
		});

		return lobbyConnection.Lobby;
	}

	async getLobby(roomId: string): Promise<Lobby> {
		return await this.prismaService.lobby.findFirst({
			where: {
				id: roomId
			},
			include: LobbySelector.Lobby.include
		})
	}

	async deleteLobbyConnection(player: Player): Promise<Lobby> {
		await this.updateSocketRooms(player, null); // Updates sockets rooms

		const lobbyConnection = await this.prismaService.playerAtLobby.delete({
			where: {
				id: player.LobbyConnectionId
			},
			select: LobbySelector
		});

		return await this.getLobby(lobbyConnection.Lobby.id);
	}

	/**
	 * Should run before any database update
	 */
	private async updateSocketRooms(player: Player, newLobbyId: string) {
		const client = this.eventsGateway.server
			.of('/')
			.sockets.get(player.socketId);

		if (player.LobbyConnectionId) {
			const oldLobby = await this.prismaService.playerAtLobby.findUnique({
				where: { id: player.LobbyConnectionId },
				include: { Lobby: true },
			});

			client.leave(oldLobby.lobbyId);
			this.eventsGateway.server
				.to(oldLobby.lobbyId)
				.emit(ClientListener.lobby, `Player ${player.nickname} left`);
		}

		if (newLobbyId) {
			this.eventsGateway.server
				.to(newLobbyId)
				.emit(ClientListener.lobby, `Player ${player.nickname} joined`);
			client.join(newLobbyId);
		}
	}
}
