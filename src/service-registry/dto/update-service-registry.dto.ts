import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceRegistryDto } from './create-service-registry.dto';

export class UpdateServiceRegistryDto extends PartialType(CreateServiceRegistryDto) {}
