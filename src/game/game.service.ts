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
		const tablesToDrop = [
			// Prisma.ModelName.Lobby,
			// Prisma.ModelName.Match,
			// Prisma.ModelName.PlayerAtLobby, 
			Prisma.ModelName.PlayerAtLobby
		];
		for (let TABLE of tablesToDrop) {
			await this.dropDatabase(TABLE);
		}
		// await this.prismaService
		//     .$executeRaw(`TRUNCATE TABLE ${Prisma.ModelName.Player} RESTART IDENTITY CASCADE;`);
	}

	async dropDatabase(dbSchemaName: string) {
		// Special fast path to drop data from a postgres database.
        // This is an optimization which is particularly crucial in a unit testing context.
        // This code path takes milliseconds, vs ~7 seconds for a migrate reset + db push
        for (const { tablename } of await this.prismaService.$queryRaw(
			`SELECT tablename FROM pg_tables WHERE schemaname='${dbSchemaName}'`
		  )) {
			await this.prismaService.$queryRaw(
			  `TRUNCATE TABLE \"${dbSchemaName}\".\"${tablename}\" CASCADE;`
			);
		  }
		  for (const { relname } of await this.prismaService.$queryRaw(
			`SELECT c.relname FROM pg_class AS c JOIN pg_namespace AS n ON c.relnamespace = n.oid WHERE c.relkind='S' AND n.nspname='${dbSchemaName}';`
		  )) {
			await this.prismaService.$queryRaw(
			  `ALTER SEQUENCE \"${dbSchemaName}\".\"${relname}\" RESTART WITH 1;`
			);
		  }
	}

	async addPlayer(nickname: string, client: Socket): Promise<Player> {
		const player = await this.prismaService.player.create({
			data: {
				nickname,
				socketId: client.id,
			},
		});

		// await this.updateSocketRooms(player, null); // Updates sockets rooms

		return player;
	}

	async changePlayer(socketId: string, player: Player) {
		throw new Error('not implemented');
	} // danger

	async getPlayer(socketId: string): Promise<Player|null> {
		return await this.prismaService.player.findUnique({
			where: { socketId },
			include: {
				LobbyConnection: true
			}
		});
	}

	async deletePlayer(player: Player) {
		return await this.prismaService.player.delete({
			where: {
				id: player.id,
			},
		});
	}

	async createLobby(player: Player): Promise<Lobby> {
		// await this.updateSocketRooms(player, id); // Updates sockets rooms

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
				Lobby: {
					create: { id: nanoid(10) }
				},
			},
			select: LobbySelector,
		});

		return lobbyConnection.Lobby;
	}

	async changeLobby(player: Player, lobbyToJoin: Lobby) {
		if (player.LobbyConnectionId) {
			const lobbyConnection = await this.prismaService.playerAtLobby.update({
				where: {
					id: player.LobbyConnectionId
				},
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
					Lobby: {
						connect: { id: lobbyToJoin.id }
					},
				},
				select: LobbySelector,
			});

			return lobbyConnection.Lobby;
		} else {
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
					Lobby: {
						connect: { id: lobbyToJoin.id }
					},
				},
				select: LobbySelector,
			});

			return lobbyConnection.Lobby;
		}
	}

	async getLobby(roomId: string) {
		return await this.prismaService.lobby.findFirst({
			where: {
				id: roomId
			},
			include: LobbySelector.Lobby.include
		})
	}

	async getPlayerLobby(player: Player): Promise<Lobby|null> {
		const searchPlayer = await this.prismaService.player.findFirst({
			where: { id: player.id },
			select: {
				LobbyConnection: {
					select: {
						Lobby: true
					}
				}
			}
		});

		return (
			searchPlayer 
			&& 
			searchPlayer.LobbyConnection 
			&& 
			searchPlayer.LobbyConnection.Lobby
		)
	}

	async checkIfPlayerIsInSomeLobby(player: Player): Promise<boolean> {
		return (await this.getPlayerLobby(player)) != null
	}

	async exitLobby(player: Player): Promise<Lobby|null> {
		// await this.updateSocketRooms(player, null); // Updates sockets rooms

		if (!player.LobbyConnectionId) return null;

		const lobbyConnection = await this.prismaService.playerAtLobby.delete({
			where: {
				id: player.LobbyConnectionId
			},
			select: LobbySelector
		});

		return await lobbyConnection.Lobby;
	}

	/**
	 * Should run before any database update
	 */
	// private async updateSocketRooms(player: Player, newLobbyId: string) {
	// 	const client = this.eventsGateway.server
	// 		.of('/')
	// 		.sockets
	// 		.get(player.socketId);

	// 	if (!client) return;
	// 	console.log(!!player, !!client);

	// 	if (player.LobbyConnectionId) {
	// 		const oldLobby = await this.prismaService.playerAtLobby.findUnique({
	// 			where: { id: player.LobbyConnectionId },
	// 			include: { Lobby: true },
	// 		});

	// 		client.leave(oldLobby.lobbyId);
	// 		this.eventsGateway.server
	// 			.to(oldLobby.lobbyId)
	// 			.emit(ClientListener.lobby, `Player ${player.nickname} left`);
	// 	}

	// 	if (newLobbyId) {
	// 		this.eventsGateway.server
	// 			.to(newLobbyId)
	// 			.emit(ClientListener.lobby, `Player ${player.nickname} joined`);
	// 		client.join(newLobbyId);
	// 	}
	// }
}
