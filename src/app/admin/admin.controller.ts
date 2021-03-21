import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from 'src/app/auth/admin-auth.guard';
import { AuthService } from 'src/app/auth/auth.service';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminCredentialsDto } from './dto/credential-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }

    @Post() 
    public async create (
        @Body() createAdminDto: CreateAdminDto
    ) {
        return this.adminService.create(createAdminDto);
    }

    @Get()
    public async findAll() {
        return this.adminService.findAll();
    }

    @Get(':nickname')
    findOne(@Param('nickname') nickname: string) {
        return this.adminService.findOne(nickname);
    }

    @Patch(':id')
    public update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
        return this.adminService.update(+id, updateAdminDto);
    }

    @Delete(':id')
    public remove(@Param('id') id: string) {
        return this.adminService.remove(+id);
    }
}
