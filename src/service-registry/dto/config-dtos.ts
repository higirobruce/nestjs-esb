import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ContractType,
  AuthType,
  RetryPolicy,
  AuditLevel,
} from '../../common/enums';

// ========== CONTRACT CONFIG ==========
export class ContractConfigDto {
  @IsOptional()
  @IsObject()
  requestSchema?: object | string;

  @IsOptional()
  @IsObject()
  responseSchema?: object | string;

  @IsOptional()
  @IsObject()
  errorSchema?: object | string;

  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType = ContractType.NONE;
}

// ========== SEMANTICS CONFIG ==========
export class SemanticsConfigDto {
  @IsOptional()
  @IsObject()
  canonicalMapping?: object;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFields?: string[];

  @IsOptional()
  @IsObject()
  referenceData?: object;
}

// ========== AUTH CONFIG ==========
export class AuthConfigDto {
  @IsEnum(AuthType)
  authType: AuthType;

  @IsOptional()
  @IsString()
  authProvider?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredScopes?: string[];

  @IsOptional()
  @IsObject()
  additionalConfig?: object;
}

// ========== RETRY CONFIG ==========
export class RetryConfigDto {
  @IsEnum(RetryPolicy)
  retryPolicy: RetryPolicy;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetries?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(100)
  initialDelayMs?: number = 1000;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  maxDelayMs?: number = 30000;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  backoffMultiplier?: number = 2;
}

// ========== HEALTH CHECK ==========
export class HealthCheckDto {
  @IsString()
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsNumber()
  @Min(5000)
  interval?: number = 30000;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeout?: number = 5000;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;
}

// ========== OPERATIONAL CONFIG ==========
export class ChangeHistoryEntryDto {
  @IsString()
  version: string;

  @IsString()
  date: string;

  @IsString()
  changes: string;

  @IsString()
  author: string;
}

export class OperationalConfigDto {
  @IsOptional()
  @IsBoolean()
  compensationSupported?: boolean = false;

  @IsOptional()
  @IsString()
  maintenanceWindow?: string;

  @IsOptional()
  @IsEnum(AuditLevel)
  auditLevel?: AuditLevel = AuditLevel.BASIC;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeHistoryEntryDto)
  changeHistory?: ChangeHistoryEntryDto[];
}
