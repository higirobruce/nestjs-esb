import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ServiceIntegrationController } from './service-integration.controller';
import { ServiceIntegrationService } from './service-integration.service';
import { ServiceCall } from './entities/service-call.entity';
import { ServiceRegistryModule } from '../service-registry/service-registry.module';
import { ClientRegistryModule } from '../client-registry/client-registry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceCall]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ServiceRegistryModule,
    ClientRegistryModule,
  ],
  controllers: [ServiceIntegrationController],
  providers: [ServiceIntegrationService],
  exports: [ServiceIntegrationService],
})
export class ServiceIntegrationModule {}
