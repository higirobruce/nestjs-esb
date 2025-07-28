import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ServiceIntegrationService } from './service-integration.service';
import { ServiceCallDto, DirectServiceCallDto, ServiceCallResponseDto } from './dto/service-call.dto';
import { ServiceCall } from './entities/service-call.entity';
import { FlexibleAuth, AdminOrService } from '../auth/decorators/auth.decorators';

@Controller('integration')
export class ServiceIntegrationController {
  constructor(private readonly serviceIntegrationService: ServiceIntegrationService) {}

  @FlexibleAuth()
  @Post('call-service')
  @HttpCode(HttpStatus.OK)
  async callService(@Body() serviceCallDto: ServiceCallDto): Promise<ServiceCallResponseDto> {
    return this.serviceIntegrationService.callService(serviceCallDto);
  }

  @FlexibleAuth()
  @Post('direct-call')
  @HttpCode(HttpStatus.OK)
  async makeDirectCall(@Body() directCallDto: DirectServiceCallDto): Promise<ServiceCallResponseDto> {
    return this.serviceIntegrationService.makeDirectCall(directCallDto);
  }

  @FlexibleAuth()
  @Get('calls/:id')
  async getServiceCall(@Param('id') id: string): Promise<ServiceCall> {
    return this.serviceIntegrationService.getServiceCall(id);
  }

  @FlexibleAuth()
  @Get('calls')
  async getServiceCalls(
    @Query('correlationId') correlationId?: string,
    @Query('serviceName') serviceName?: string,
  ): Promise<ServiceCall[]> {
    return this.serviceIntegrationService.getServiceCalls(correlationId, serviceName);
  }

  @FlexibleAuth()
  @Get('stats')
  async getServiceCallStats(@Query('serviceName') serviceName?: string): Promise<any> {
    return this.serviceIntegrationService.getServiceCallStats(serviceName);
  }
}
