import { CACHE_MANAGER, forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Lobby, Player, PlayerAtLobby, Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { Socket } from 'socket.io';
import { EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomDto } from './dto/room.dto';

@Injectable()
export class GameService implements OnModuleInit {
    logger = new Logger(GameService.name);

    constructor (
        private prismaService: PrismaService,
        @Inject(forwardRef(() => EventsGateway)) private eventsGateway: EventsGateway
    ) {}

    public emptyRoom: RoomDto = { roomId: null, playersIds: [] };

    async onModuleInit() {
        await this.prismaService
            .$executeRaw(`TRUNCATE TABLE Player RESTART IDENTITY CASCADE;`);

        this.prismaService.$use(async (param, next) => {
            if (param.model == Prisma.ModelName.PlayerAtLobby) {
                if (param.action == 'create') {

                }
                else if (param.action == 'delete') {
                    
                }
            }

            return next(param);
        })
    }

    buildId(id: string) { return `player-${id}` }

    async addPlayer(nickname: string, client: Socket): Promise<Player> {
        const player = await this.prismaService.player.create({
            data: {
                nickname,
                socketId: client.id
            }
        });

        return player;
    }

    async changePlayer(socketId: string, player: Player) {

    }

    async getPlayer(socketId: string): Promise<Player> {
        return await this.prismaService.player.findUnique({
            where: { socketId }
        })
    }

    async deletePlayer(id: string) {

    }

    async createLobby(player: Player): Promise<PlayerAtLobby> {
        const lobbyConnection = await this.prismaService.playerAtLobby.create({
            data: {
                isReady: false,

                Player: {
                    connect: player
                },
                Match: {
                    create: {
                        score: 0,
                        answeredQuestions: 0
                    }
                },
                Lobby: {
                    create: {
                        id: nanoid(10)
                    }
                }
            },
            include: {
                Lobby: true,
                Match: true
            }
        });

        return lobbyConnection;
    }

    async updatePlayerRoom(player: Player, roomId: string | null): Promise<any> {
        const newLobby = await this.createLobby(player);
    }
}
