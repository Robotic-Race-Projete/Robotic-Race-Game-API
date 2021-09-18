import { Module } from '@nestjs/common';
import { AnswerModule } from 'src/app/answer/answer.module';
import { QuestionModule } from 'src/app/question/question.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './game.service';
import { GameConfigurationService } from './gameConfig.service';

@Module({
    imports: [
        PrismaModule,
        AnswerModule,
        QuestionModule
    ],
    providers: [GameService, GameConfigurationService],
    exports: [GameService, GameConfigurationService]
})
export class GameModule {}
