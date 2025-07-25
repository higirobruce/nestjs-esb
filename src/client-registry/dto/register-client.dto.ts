import { IsString, IsArray, IsBoolean, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RateLimitsDto {
  @IsOptional()
  requestsPerMinute?: number = 100;

  @IsOptional()
  requestsPerHour?: number = 1000;
}

export class RegisterClientDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  allowedServices: string[];

  @ValidateNested()
  @Type(() => RateLimitsDto)
  @IsOptional()
  rateLimits?: RateLimitsDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> = {};
}