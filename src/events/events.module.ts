import { CACHE_MANAGER, forwardRef, Module } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { EventsGateway } from './events.gateway';
import { Cache } from 'cache-manager';

@Module({
	imports: [forwardRef(() => GameModule)],
	providers: [
		EventsGateway
	],
	exports: [
		EventsGateway
	]
})
export class EventsModule {}
