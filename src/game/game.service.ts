import { CACHE_MANAGER, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';
import { Player, PlayerDto } from './dto/player.dto';
import { RoomDto } from './dto/room.dto';

@Injectable()
export class GameService implements OnModuleInit {
    logger = new Logger(GameService.name);

    constructor (@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    public emptyRoom: RoomDto = { roomId: null, playersIds: [] };

    async onModuleInit() {
        await this.cacheManager.reset();
    }

    async addPlayer(nickname: string, client: Socket): Promise<void> {
        const socketId = client.id;
        const player: Player = { nickname, socketId, playingRoomId: null, isHost: false };
        await this.cacheManager.set(socketId, player);
    }

    async changePlayer(socketId: string, player: Player) {
        await this.cacheManager.set(socketId, player);
    }

    async getPlayer(id: string): Promise<Player | null> {
        return await this.cacheManager.get(id);
    }

    async deletePlayer(id: string) {
        await this.cacheManager.del(id);
    }

    async roomCreatedByHost(player: Player, roomId: string | null): Promise<RoomDto> {
        this.changePlayer(player.socketId, { ...player, playingRoomId: roomId, isHost: true });

        return { roomId, playersIds: [ player.socketId ] }
    }

    async updatePlayerRoom(player: Player, roomId: string | null): Promise<RoomDto> {
        this.changePlayer(player.socketId, { ...player, playingRoomId: roomId, isHost: false });

        return { roomId, playersIds: [ player.socketId ] }
    }

    // async deletehostRoom(host: Socket) {

    // }

    // async deleteRoom(roomId: string) {

    // }
}
