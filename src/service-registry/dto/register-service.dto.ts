import {
  IsString,
  IsUrl,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  IsDate,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ServiceStatus,
  ProtocolType,
  SyncMode,
  FailureMode,
  InvocationRole,
  Environment,
} from '../../common/enums';
import {
  ContractConfigDto,
  SemanticsConfigDto,
  AuthConfigDto,
  RetryConfigDto,
  HealthCheckDto,
  OperationalConfigDto,
} from './config-dtos';

export class RegisterServiceDto {
  // ========== MANDATORY: IDENTITY ==========
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  version: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  ownerSystem: string;

  @IsEnum(Environment)
  environment: Environment;

  // ========== MANDATORY: INVOCATION ==========
  @IsEnum(ProtocolType)
  protocol: ProtocolType;

  @IsString()
  @IsUrl({ require_tld: false })
  endpoint: string;

  @IsString()
  @IsOptional()
  operation?: string;

  @IsEnum(SyncMode)
  syncMode: SyncMode;

  // ========== OPTIONAL: CONTRACT ==========
  @ValidateNested()
  @Type(() => ContractConfigDto)
  @IsOptional()
  contractConfig?: ContractConfigDto;

  // ========== OPTIONAL: SEMANTICS ==========
  @ValidateNested()
  @Type(() => SemanticsConfigDto)
  @IsOptional()
  semanticsConfig?: SemanticsConfigDto;

  // ========== MANDATORY: SECURITY ==========
  @ValidateNested()
  @Type(() => AuthConfigDto)
  authConfig: AuthConfigDto;

  // ========== MANDATORY: RELIABILITY ==========
  @IsNumber()
  @Min(100)
  @Max(300000)
  timeoutMs: number;

  @ValidateNested()
  @Type(() => RetryConfigDto)
  @IsOptional()
  retryConfig?: RetryConfigDto;

  @IsBoolean()
  idempotent: boolean;

  // ========== MANDATORY: LIFECYCLE ==========
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus = ServiceStatus.ACTIVE;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveDate?: Date;

  // ========== STRONGLY RECOMMENDED ==========
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  rateLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(60000)
  slaLatencyMs?: number;

  @ValidateNested()
  @Type(() => HealthCheckDto)
  @IsOptional()
  healthCheck?: HealthCheckDto;

  @IsEnum(FailureMode)
  @IsOptional()
  failureMode?: FailureMode = FailureMode.FAIL_FAST;

  @IsEnum(InvocationRole)
  @IsOptional()
  invocationRole?: InvocationRole = InvocationRole.BOTH;

  // ========== OPTIONAL ==========
  @ValidateNested()
  @Type(() => OperationalConfigDto)
  @IsOptional()
  operationalConfig?: OperationalConfigDto;

  // ========== LEGACY ==========
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> = {};
}
