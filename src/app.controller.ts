import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import env from './env/env';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    getHello(): Promise<Object> {
        return this.appService.getHello();
    }
}
