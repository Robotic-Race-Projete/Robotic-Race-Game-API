import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const providers = [
    PrismaService
]

@Module({
	imports: [],
	controllers: [],
	providers: providers,
    exports: providers
})
export class PrismaModule {}
