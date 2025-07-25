import { IsString, IsObject, IsOptional } from 'class-validator';

export class ExecuteWorkflowDto {
  @IsString()
  workflowId: string;

  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsObject()
  @IsOptional()
  initialContext?: Record<string, any> = {};
}
