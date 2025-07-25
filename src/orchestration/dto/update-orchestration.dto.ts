import { PartialType } from '@nestjs/mapped-types';
import { CreateOrchestrationDto } from './create-orchestration.dto';

export class UpdateOrchestrationDto extends PartialType(CreateOrchestrationDto) {}
