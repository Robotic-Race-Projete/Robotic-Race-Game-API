import { Module } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { EventsGateway } from './events.gateway';

@Module({
	imports: [GameModule],
	providers: [EventsGateway],
})
export class EventsModule {}
