import { PartialType } from '@nestjs/mapped-types';
import { CreateClientRegistryDto } from './create-client-registry.dto';

export class UpdateClientRegistryDto extends PartialType(CreateClientRegistryDto) {}
