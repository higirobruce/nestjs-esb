import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRegistryService } from './service-registry.service';
import { ServiceRegistryController } from './service-registry.controller';
import { Service } from './entities/service-registry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServiceRegistryController],
  providers: [ServiceRegistryService],
  exports: [ServiceRegistryService],
})
export class ServiceRegistryModule {}