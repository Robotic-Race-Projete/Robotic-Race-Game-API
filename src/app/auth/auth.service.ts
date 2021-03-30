import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import env from "src/env/env";
import { PrismaService } from "src/prisma/prisma.service";

import * as bcrypt from 'bcrypt';
import { AdminAuth } from "./dto/auth-admin.dto";
import { JwtService } from "@nestjs/jwt";
import { Admin } from "src/app/admin/entities/admin.entity";
import { AdminService } from "src/app/admin/admin.service";
import { AdminCredentialsDto } from "../admin/dto/credential-admin.dto";
import { AdminLoginDto } from "./dto/admin-login.dto";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private adminService: AdminService
    ) { }

    async validateAdmin(nickname: string, password: string) {
        const queriedAdmin = await this.adminService.findOneWithCredentials(nickname);

        // Not found
        if (queriedAdmin === null) {
            throw new NotFoundException('User not found');
        }

        const isPasswordRight = await bcrypt.compare(password, queriedAdmin.password);
        if (isPasswordRight) {
            const { password, ...result } = queriedAdmin;
            return result;
        }
        return null;
    }

    async login(admin: AdminLoginDto) {
        const payload: JwtPayload = { username: admin.nickname, sub: admin.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
