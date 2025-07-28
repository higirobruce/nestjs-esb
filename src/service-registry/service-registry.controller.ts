import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ServiceRegistryService } from './service-registry.service';
import { RegisterServiceDto } from './dto/register-service.dto';
import { ServiceStatus } from '../common/enums/service-status.enum';
import { FlexibleAuth, AdminOrService, Public } from '../auth/decorators/auth.decorators';

@Controller('services')
export class ServiceRegistryController {
  constructor(private readonly serviceRegistryService: ServiceRegistryService) {}

  @AdminOrService()
  @Post()
  async registerService(@Body() registerServiceDto: RegisterServiceDto) {
    return this.serviceRegistryService.registerService(registerServiceDto);
  }

  @FlexibleAuth()
  @Get()
  async getAllServices() {
    return this.serviceRegistryService.getAllServices();
  }

  @Public()
  @Get('active')
  async getActiveServices() {
    return this.serviceRegistryService.getActiveServices();
  }

  @FlexibleAuth()
  @Get(':name')
  async getService(@Param('name') name: string, @Query('version') version?: string) {
    return this.serviceRegistryService.getService(name, version);
  }

  @AdminOrService()
  @Patch(':id/status')
  async updateServiceStatus(@Param('id') id: string, @Body('status') status: ServiceStatus) {
    return this.serviceRegistryService.updateServiceStatus(id, status);
  }

  @AdminOrService()
  @Delete(':id')
  async unregisterService(@Param('id') id: string) {
    await this.serviceRegistryService.unregisterService(id);
    return { message: 'Service unregistered successfully' };
  }
}