import { CACHE_MANAGER, Module } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { GameService } from 'src/game/game.service';
import { EventsGateway } from './events.gateway';
import { Cache } from 'cache-manager';

@Module({
	imports: [GameModule],
	providers: [
		EventsGateway
	],
})
export class EventsModule {}
