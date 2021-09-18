import {
	CACHE_MANAGER,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WsException } from '@nestjs/websockets';
import { Lobby, Player, Answer, Question, PlayerAtLobby, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { last } from 'rxjs/operators';
import { Socket } from 'socket.io';
import { AnswerService } from 'src/app/answer/answer.service';
import { QuestionService } from 'src/app/question/question.service';
import { ClientListener, EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { GameConfigurationService } from './gameConfig.service';

const LobbyInclusor = {
	Lobby: {
		include: {
			Players: {
				include: {
					Player: true
				}
			}
		},
	},
};

@Injectable()
export class GameService implements OnModuleInit {
	logger = new Logger(GameService.name);

	constructor(
		private prismaService: PrismaService,
		private schedulerRegistry: SchedulerRegistry,
		private gameConfig: GameConfigurationService,
		private answerService: AnswerService,
		private questionService: QuestionService
	) {}

	async onModuleInit() {
		const tablesToDrop = [
			Prisma.ModelName.Player,
			Prisma.ModelName.Match,
			Prisma.ModelName.Lobby,
			Prisma.ModelName.PlayerAtLobby,
		];
		for (let TABLE of tablesToDrop) {
			await this.prismaService.$queryRaw(
				`TRUNCATE TABLE \"${TABLE}\" RESTART IDENTITY CASCADE;`
			);
		}
		// await this.prismaService
		//     .$executeRaw(`TRUNCATE TABLE ${Prisma.ModelName.Player} RESTART IDENTITY CASCADE;`);
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

	async getPlayer(socketId: string): Promise<Player | null> {
		return await this.prismaService.player.findUnique({
			where: { socketId },
			include: {
				LobbyConnection: true,
			},
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
					create: { id: nanoid(10) },
				},
			},
			select: LobbyInclusor,
		});

		return lobbyConnection.Lobby;
	}

	async changeLobby(player: Player, lobbyToJoin: Lobby) {
		if (player.LobbyConnectionId) {
			const lobbyConnection =
				await this.prismaService.playerAtLobby.update({
					where: {
						id: player.LobbyConnectionId,
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
							connect: { id: lobbyToJoin.id },
						},
					},
					select: LobbyInclusor,
				});

			return lobbyConnection.Lobby;
		} else {
			const lobbyConnection =
				await this.prismaService.playerAtLobby.create({
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
							connect: { id: lobbyToJoin.id },
						},
					},
					select: LobbyInclusor,
				});

			return lobbyConnection.Lobby;
		}
	}

	async getLobby(roomId: string) {
		return await this.prismaService.lobby.findFirst({
			where: {
				id: roomId,
			},
			include: {
				Players: {
					include: {
						Player: true
					}
				}
			},
		});
	}

	async getPlayerLobby(player: Player): Promise<Lobby | null> {
		const searchPlayer = await this.prismaService.player.findFirst({
			where: { id: player.id },
			select: {
				LobbyConnection: {
					select: {
						Lobby: true,
					},
				},
			},
		});

		return (
			searchPlayer &&
			searchPlayer.LobbyConnection &&
			searchPlayer.LobbyConnection.Lobby
		);
	}

	async makePlayerReady(player: Player, value: boolean) {
		if (!player.LobbyConnectionId) return null;

		const playerAtLobby = await this.prismaService.playerAtLobby.update({
			where: {
				id: player.LobbyConnectionId,
			},
			data: {
				isReady: value,
			},
			include: {
				Player: true,
				Lobby: LobbyInclusor.Lobby,
			}
		});

		return playerAtLobby;
	}

	async startGame (lobby: Lobby, callback: (next: Function) => Promise<any>) {
		await this.prismaService.lobby.update({
			where: {
				id: lobby.id
			},
			data: {
				isOnMatch: true
			}
		});

		this.procedeGame(callback, lobby);
		// this.schedulerRegistry.addInterval(lobby.id, interval);
		this.logger.log(`Lobby ${lobby.id} started a game!`);
	}

	async procedeGame(callback: (next: Function) => Promise<any>, lobby: Lobby) {
		const nextExecution = setTimeout(async () => {
			this.schedulerRegistry.deleteTimeout(lobby.id);
			this.procedeGame(callback, lobby);
		}, this.gameConfig.timeToAnswerAQuestion*1000);
		this.schedulerRegistry.addTimeout(lobby.id, nextExecution);

		const skipToExecution = () => {
			this.schedulerRegistry.deleteTimeout(lobby.id);
			this.procedeGame(callback, lobby);
		}
		
		callback(skipToExecution);
	}

	async goToNextRound (callback: (next: Function) => Promise<any>, lobby: Lobby) {
		this.schedulerRegistry.deleteTimeout(lobby.id);
		this.procedeGame(callback, lobby);
	}

	async stopGame (lobby: Lobby) {
		this.schedulerRegistry.deleteInterval(lobby.id);
		this.logger.log(`Lobby ${lobby.id} finished a game!`);
	}

	async checkIfPlayerIsInSomeLobby(player: Player): Promise<boolean> {
		return (await this.getPlayerLobby(player)) != null;
	}

	async exitLobby(player: Player): Promise<Lobby | null> {
		// await this.updateSocketRooms(player, null); // Updates sockets rooms

		if (!player.LobbyConnectionId) return null;

		const lobbyConnection = await this.prismaService.playerAtLobby.delete({
			where: {
				id: player.LobbyConnectionId,
			},
			select: LobbyInclusor,
		});

		return await lobbyConnection.Lobby;
	}

	async generateRandomQuestion(lobby: Lobby) {
		const question = await this.questionService.getRandomQuestion();

		await this.prismaService.lobby.update({
			where: {
				id: lobby.id
			},
			data: {
				questionsToAnswer: {
					create: {
						question: {
							connect: {
								id: question.id
							}
						}
					}
				}
			},
			include: {
				questionsToAnswer: true
			}
		});

		return question;
	}

	async checkAnswer (answer_id: number, question_id: number, lobby: Lobby): Promise<boolean> {
		const PossibleLastQuestion = await this.prismaService.questionToAnswer.findMany({
			where: {
				lobbyId: lobby.id
			},
			orderBy: {
				gotAt: 'desc',
			},
			take: 1,
			include: {
				question: {
					include: {
						answers: true
					}
				}
			}
		});

		if (PossibleLastQuestion && PossibleLastQuestion[0]) {
			const lastQuestion = PossibleLastQuestion[0];

			if (lastQuestion.question.id != question_id) {
				return false;
			}

			return lastQuestion.question.answers.some(answer => (
				answer.id == answer_id && answer.isRight
			));
		} else {
			return false
		}

	}

	async giveScoreToPlayer(player: Player, score: number) {
		return await this.prismaService.playerAtLobby.update({
			where: {
				id: player.LobbyConnectionId ?? undefined
			},
			data: {
				Match: {
					update: {
						score: {
							increment: score,
						},
						answeredQuestions: {
							increment: 1
						}
					}
				}
			}
		});
	}
}
