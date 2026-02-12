import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ServiceStatus,
  Environment,
  ProtocolType,
  InvocationRole,
} from '../../common/enums';

export class QueryServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;

  @IsOptional()
  @IsEnum(ProtocolType)
  protocol?: ProtocolType;

  @IsOptional()
  @IsString()
  ownerSystem?: string;

  @IsOptional()
  @IsEnum(InvocationRole)
  invocationRole?: InvocationRole;
}
