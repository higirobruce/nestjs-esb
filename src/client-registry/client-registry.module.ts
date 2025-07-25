import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientRegistryService } from './client-registry.service';
import { ClientRegistryController } from './client-registry.controller';
import { Client } from './entities/client-registry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientRegistryController],
  providers: [ClientRegistryService],
  exports: [ClientRegistryService],
})
export class ClientRegistryModule {}