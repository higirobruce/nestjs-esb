import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ClientRegistryService } from './client-registry.service';
import { RegisterClientDto } from './dto/register-client.dto';

@Controller('clients')
export class ClientRegistryController {
  constructor(private readonly clientRegistryService: ClientRegistryService) {}

  @Post()
  async registerClient(@Body() registerClientDto: RegisterClientDto) {
    return this.clientRegistryService.registerClient(registerClientDto);
  }

  @Get()
  async getAllClients() {
    return this.clientRegistryService.getAllClients();
  }

  @Get(':id')
  async getClient(@Param('id') id: string) {
    return this.clientRegistryService.getClient(id);
  }

  @Patch(':id/deactivate')
  async deactivateClient(@Param('id') id: string) {
    return this.clientRegistryService.deactivateClient(id);
  }

  @Patch(':id/regenerate-key')
  async regenerateApiKey(@Param('id') id: string) {
    return this.clientRegistryService.regenerateApiKey(id);
  }
}