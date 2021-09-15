import { CacheModule, forwardRef, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import env from 'src/env/env';
import { EventsModule } from 'src/events/events.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './game.service';

@Module({
    imports: [
        PrismaModule
    ],
    providers: [GameService],
    exports: [GameService]
})
export class GameModule {}
