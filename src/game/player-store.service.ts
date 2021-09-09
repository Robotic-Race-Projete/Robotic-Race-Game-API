import { CACHE_MANAGER, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';
import { Player, PlayerDto } from './dto/player.dto';
import { RoomDto } from './dto/room.dto';

@Injectable()
export class PlayerStoreService implements OnModuleInit {
    logger = new Logger(PlayerStoreService.name);

    constructor (
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    public emptyRoom: RoomDto = { roomId: null, playersIds: [] };

    async onModuleInit() {
        await this.cacheManager.reset();
    }

    buildId(id: string) { return `player-${id}` }

    async addPlayer(nickname: string, client: Socket): Promise<void> {
        const socketId = client.id;
        const player: Player = { nickname, id: socketId, playingRoomId: null, isHost: false };
        const builtId = this.buildId(socketId);
        await this.cacheManager.set(builtId, player);
    }

    async changePlayer(socketId: string, player: Player) {
        const builtId = this.buildId(socketId);
        await this.cacheManager.set(builtId, player);
    }

    async getPlayer(id: string): Promise<Player | null> {
        const builtId = this.buildId(id);
        return await this.cacheManager.get(builtId);
    }

    async deletePlayer(id: string) {
        const builtId = this.buildId(id);
        await this.cacheManager.del(builtId);
    }

    async roomCreatedByHost(player: Player, roomId: string | null): Promise<RoomDto> {
        this.changePlayer(player.id, { ...player, playingRoomId: roomId, isHost: true });

        return { roomId, playersIds: [ player.id ] }
    }

    async updatePlayerRoom(player: Player, roomId: string | null): Promise<RoomDto> {
        this.changePlayer(player.id, { ...player, playingRoomId: roomId, isHost: false });

        return { roomId, playersIds: [ player.id ] }
    }
}
