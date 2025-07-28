import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/auth.decorators';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NestJS ESB',
    };
  }
}
