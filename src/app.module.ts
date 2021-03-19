import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformerInterceptor } from './core/http/response-transformer.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env/env.validation';
import { UserModule } from './user/user.module';

@Module({
	imports: [
        QuestionModule,
        AnswerModule, 
        AuthModule,
        ConfigModule.forRoot({
            validate: validateEnv,
        }),
        UserModule
    ],
	controllers: [AppController],
	providers: [
		AppService, 
		PrismaService,
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseTransformerInterceptor
		}
	],
})
export class AppModule {}
