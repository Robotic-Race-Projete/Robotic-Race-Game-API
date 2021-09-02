import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from 'src/app/auth/admin-auth.guard';
import { AuthService } from 'src/app/auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminCredentialsDto } from './dto/credential-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }

    // @UseGuards(JwtAuthGuard)
    @Post() 
    public async create (
        @Body() createAdminDto: CreateAdminDto
    ) {
        return this.adminService.create(createAdminDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    public async findAll() {
        console.log('hello')
        console.log(this.adminService.findAll());
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('nickname') id: number) {
        return this.adminService.findOne(id);
    }

    // @Patch(':id')
    // public update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    //     return this.adminService.update(+id, updateAdminDto);
    // }

    // @Delete(':id')
    // public remove(@Param('id') id: string) {
    //     return this.adminService.remove(+id);
    // }
}
