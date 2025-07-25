import { IsString, IsOptional, IsObject, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsString()
  source: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  messageType: string;

  @IsObject()
  payload: any;

  @IsObject()
  @IsOptional()
  headers?: Record<string, any> = {};

  @IsNumber()
  @IsOptional()
  priority?: number = 0;

  @IsNumber()
  @IsOptional()
  ttl?: number;
}