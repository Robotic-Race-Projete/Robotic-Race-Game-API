import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Socket } from 'dgram';
import { Player } from './dto/player.dto';

@Injectable()
export class GameService {
    nextPlayerId = 1;


    constructor (@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async addPlayer(nickname: string, client: Socket) {
        const player: Player = { nickname, client, playingRoomId: null };
        await this.cacheManager.set(`player-${this.nextPlayerId}`, player);
    }

    async getPlayer(id: number): Promise<Player | null> {
        return await this.cacheManager.get(`player-${id}`);
    }
}
