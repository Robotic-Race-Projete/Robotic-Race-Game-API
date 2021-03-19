import { Injectable, NotFoundException } from "@nestjs/common";
import env from "src/env/env";
import { PrismaService } from "src/prisma/prisma.service";

import * as bcrypt from 'bcrypt';
import { UserAuth } from "./dto/auth-user.dto";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const queriedUser = await this.prisma.user.findUnique({ 
            where: {
                email
            }
        });

        // Not found
        if (!queriedUser) {
            throw new NotFoundException('User not found');
        }

        const isPasswordRight = await bcrypt.compare(password, queriedUser.password);
        return isPasswordRight;
    }

}
