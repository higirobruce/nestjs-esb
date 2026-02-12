import { PartialType } from '@nestjs/mapped-types';
import { RegisterServiceDto } from './register-service.dto';

export class UpdateServiceDto extends PartialType(RegisterServiceDto) {}
