import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminStrategy } from './admin.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import env from 'src/env/env';
import { AdminModule } from 'src/app/admin/admin.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller'

@Module({
    imports: [
        PrismaModule,
        AdminModule,
        JwtModule.register({
            secret: env.JWT_SECRET,
            signOptions: { expiresIn: '60s' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AdminStrategy],
    exports: [AuthService]
})
export class AuthModule { }
