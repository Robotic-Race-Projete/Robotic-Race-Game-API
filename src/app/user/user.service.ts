import { ConflictException, Injectable } from '@nestjs/common';
import env from 'src/env/env';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
    constructor (
        private prisma: PrismaService
    ) {}

    async create(username: string, email: string, password: string) {
        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new ConflictException('Email already exists')
        }

        const saltRounds = env.BCRYPT_SALT_ROUNDS;
        console.log(saltRounds, typeof saltRounds)
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        return this.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        })
    }

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany();
    }

    findOne(id: number) {
        return `This action returns a #${id} user`;
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`;
    }

    remove(id: number) {
        return `This action removes a #${id} user`;
    }
}
