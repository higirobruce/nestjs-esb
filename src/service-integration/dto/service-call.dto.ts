import { IsString, IsOptional, IsEnum, IsObject, IsNumber, Min, Max, IsUrl, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HttpMethod } from '../entities/service-call.entity';
import { ResponseProjectionDto } from './projection.dto';

export class ServiceCallDto {
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsString()
  @IsOptional()
  serviceVersion?: string;

  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsEnum(HttpMethod)
  method: HttpMethod;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsObject()
  @IsOptional()
  queryParams?: Record<string, string>;

  @IsOptional()
  body?: any;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetries?: number = 0;

  @IsNumber()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  timeoutMs?: number = 30000;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseProjectionDto)
  responseProjection?: ResponseProjectionDto;
}

export class DirectServiceCallDto {
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  url: string;

  @IsEnum(HttpMethod)
  method: HttpMethod;

  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsObject()
  @IsOptional()
  queryParams?: Record<string, string>;

  @IsOptional()
  body?: any;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetries?: number = 0;

  @IsNumber()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  timeoutMs?: number = 30000;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseProjectionDto)
  responseProjection?: ResponseProjectionDto;
}

export class ServiceCallResponseDto {
  id: string;
  correlationId: string;
  status: number;
  headers: Record<string, string>;
  data: any;
  executionTimeMs: number;
  retryCount: number;
}
