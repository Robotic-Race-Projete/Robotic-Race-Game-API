import { Module } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AnswerController],
  providers: [AnswerService, PrismaService],
  exports: [AnswerService]
})
export class AnswerModule {}
