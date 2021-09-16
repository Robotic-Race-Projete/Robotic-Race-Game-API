import { CACHE_MANAGER, forwardRef, Module } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { EventsGateway } from './events.gateway';
import { Cache } from 'cache-manager';
import { QuestionModule } from 'src/app/question/question.module';

@Module({
	imports: [forwardRef(() => GameModule), QuestionModule],
	providers: [
		EventsGateway
	],
	exports: [
		EventsGateway
	]
})
export class EventsModule {}
