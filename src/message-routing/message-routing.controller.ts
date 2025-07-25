import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MessageRoutingService } from './message-routing.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('routing')
export class MessageRoutingController {
  constructor(private readonly messageRoutingService: MessageRoutingService) {}

  @Post('routes')
  async createRoute(@Body() createRouteDto: CreateRouteDto) {
    return this.messageRoutingService.createRoute(createRouteDto);
  }

  @Get('routes')
  async getAllRoutes() {
    return this.messageRoutingService.getAllRoutes();
  }

  @Get('routes/:id')
  async getRoute(@Param('id') id: string) {
    return this.messageRoutingService.getRoute(id);
  }

  @Put('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() updateData: any) {
    return this.messageRoutingService.updateRoute(id, updateData);
  }

  @Delete('routes/:id')
  async deleteRoute(@Param('id') id: string) {
    await this.messageRoutingService.deleteRoute(id);
    return { message: 'Route deleted successfully' };
  }

  @Post('send')
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.messageRoutingService.routeMessage(sendMessageDto);
  }

  @Get('logs')
  async getMessageLogs(@Query('correlationId') correlationId?: string) {
    return this.messageRoutingService.getMessageLogs(correlationId);
  }
}
