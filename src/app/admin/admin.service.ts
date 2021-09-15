import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Admin, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

import * as bcrypt from 'bcrypt';
import env from 'src/env/env';
import { AdminReturnedDto } from './dto/return-admin.dto';

@Injectable()
export class AdminService {
    constructor (
        private prisma: PrismaService
    ) {}
        
    async create(createAdminDto: CreateAdminDto): Promise<AdminReturnedDto> {
        const { nickname, password } = createAdminDto;

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
            },
            select: {
                id: true,
                nickname: true,
                createdAt: true
            }
        })
    }

    async findAll(): Promise<AdminReturnedDto[]> {
        return this.prisma.admin.findMany({
            select: {
                id: true,
                nickname: true,
                createdAt: true
            }
        });
    }

    findOne (id: number): Promise<AdminReturnedDto|null> {
        return this.prisma.admin.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                nickname: true,
                createdAt: true
            }
        });
    }

    findOneWithCredentials (nickname: string): Promise<Admin|null> {
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
