import { IsString, IsUrl, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatus } from '../../common/enums/service-status.enum';

class HealthCheckDto {
  @IsUrl()
  url: string;

  @IsOptional()
  interval?: number = 30000;

  @IsOptional()
  timeout?: number = 5000;
}

export class RegisterServiceDto {
  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsUrl()
  endpoint: string;

  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus = ServiceStatus.ACTIVE;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> = {};

  @ValidateNested()
  @Type(() => HealthCheckDto)
  @IsOptional()
  healthCheck?: HealthCheckDto;
}