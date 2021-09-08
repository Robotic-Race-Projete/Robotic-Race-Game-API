import { CacheModule, Module } from '@nestjs/common';
import { GameService } from './game.service';
import * as redisStore from 'cache-manager-redis-store';
import env from 'src/env/env';

@Module({
    imports: [
        CacheModule.register({
			store: redisStore,
			host: env.REDIS_HOST,
			port: env.REDIS_PORT,
            ttl: 0
		}),
    ],
    providers: [GameService],
    exports: [GameService]
})
export class GameModule {}
