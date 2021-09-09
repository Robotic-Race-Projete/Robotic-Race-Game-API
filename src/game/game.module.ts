import { CacheModule, forwardRef, Module } from '@nestjs/common';
import { PlayerStoreService } from './player-store.service';
import { LobbyStoreService } from './lobby-store.service';
import * as redisStore from 'cache-manager-redis-store';
import env from 'src/env/env';
import { EventsModule } from 'src/events/events.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        CacheModule.register({
			store: redisStore,
			host: env.REDIS_HOST,
			port: env.REDIS_PORT,
            ttl: 0
		}),
        forwardRef(() => EventsModule),
        PrismaModule
    ],
    providers: [PlayerStoreService, LobbyStoreService],
    exports: [PlayerStoreService, LobbyStoreService]
})
export class GameModule {}
