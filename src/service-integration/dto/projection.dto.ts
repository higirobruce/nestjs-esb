import { IsOptional, IsEnum, IsString, IsArray, IsBoolean } from 'class-validator';

export enum ProjectionMode {
  PRESET = 'preset',
  FIELDS = 'fields',
}

export class ResponseProjectionDto {
  @IsOptional()
  @IsEnum(ProjectionMode)
  mode?: ProjectionMode;

  @IsOptional()
  @IsString()
  preset?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  @IsBoolean()
  validateAgainstSchema?: boolean;
}
