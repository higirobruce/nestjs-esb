import { IsString, IsArray, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  name: string;

  @IsString()
  pattern: string;

  @IsArray()
  @IsString({ each: true })
  destinations: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  transformations?: string[];

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsNumber()
  @IsOptional()
  priority?: number = 0;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}