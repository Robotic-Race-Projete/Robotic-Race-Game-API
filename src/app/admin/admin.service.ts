import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Admin } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

import * as bcrypt from 'bcrypt';
import env from 'src/env/env';

@Injectable()
export class AdminService {
    constructor (
        private prisma: PrismaService
    ) {}
        
    async create(createAdminDto: CreateAdminDto): Promise<Admin> {
        const { nickname, password } = createAdminDto

        // Check for nickname
        const aNotPossibleAdmin = await this.prisma.admin.findUnique({
            where: { nickname }
        })
        if (aNotPossibleAdmin) {
            throw new ConflictException(`User with ${nickname} already exists`)
        }

        return this.prisma.admin.create({
            data: {
                nickname: nickname,
                password: await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)
            }
        })
    }

    async findAll() {
        return this.prisma.admin.findMany();
    }

    findOne (nickname: string): Promise<Admin|null> {
        return this.prisma.admin.findUnique({
            where: {
                nickname
            }
        });
    }

    update(id: number, updateAdminDto: UpdateAdminDto) {
        return `This action updates a #${id} admin`;
    }

    remove(id: number) {
        return `This action removes a #${id} admin`;
    }
}
