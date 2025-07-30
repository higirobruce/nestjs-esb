import { Module } from '@nestjs/common';
import { CitizenService } from './citizen.service';
import { CitizenController } from './citizen.controller';
import { NationalRegistryCitizenTransformer } from '../canonical-data-model/transformers/national-registry-citizen.transformer';
import { ServiceIntegrationModule } from '../service-integration/service-integration.module';

@Module({
  imports: [ServiceIntegrationModule], // Import module for making HTTP calls
  controllers: [CitizenController],
  providers: [
    CitizenService,
    NationalRegistryCitizenTransformer, // Provide the transformer for dependency injection
  ],
  exports: [CitizenService], // Export the service for other modules to use
})
export class CitizenModule {}
