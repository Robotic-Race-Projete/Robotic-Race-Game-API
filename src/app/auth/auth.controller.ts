import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AdminCredentialsDto } from "src/app/admin/dto/credential-admin.dto";
import { AdminService } from "../admin/admin.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AuthService } from "./auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminAuth } from "./dto/auth-admin.dto";

@Controller('auth')
export class AuthController {
    constructor (
        private authService: AuthService
    ) {}

    @UseGuards(AdminAuthGuard)
    @Post('admin')
    public async loginAdmin (
        @Body() adminCredentials: AdminAuth,
        @Req() req
    ) {
        const admin: AdminLoginDto = req.user;
        return this.authService.login(
            admin
        );
    }
}