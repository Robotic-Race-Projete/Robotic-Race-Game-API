import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './game.service';
import { GameConfigurationService } from './gameConfig.service';

@Module({
    imports: [
        PrismaModule
    ],
    providers: [GameService, GameConfigurationService],
    exports: [GameService, GameConfigurationService]
})
export class GameModule {}
