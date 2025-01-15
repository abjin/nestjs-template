import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return { uptime: process.uptime(), ...process.memoryUsage() };
  }
}
