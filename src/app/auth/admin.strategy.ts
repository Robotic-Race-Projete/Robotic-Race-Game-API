
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminCredentialsDto } from '../admin/dto/credential-admin.dto';

@Injectable()
export class AdminStrategy extends PassportStrategy(Strategy, 'admin') {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'nickname',
            passwordField: 'password'
        });
    }

    async validate(username: string, password: string): Promise<any> {
        const adminUser = await this.authService.validateAdmin(
            username, password
        );
        if (adminUser === null) throw new UnauthorizedException();
        return adminUser;
    }
}