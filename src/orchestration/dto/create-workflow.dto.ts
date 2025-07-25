import { IsString, IsArray, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStep, RetryPolicy } from '../entities/workflow.entity';

class WorkflowStepDto implements WorkflowStep {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: 'service_call' | 'condition' | 'parallel' | 'delay' | 'transform';

  @IsObject()
  config: Record<string, any>;

  @IsString()
  @IsOptional()
  onSuccess?: string;

  @IsString()
  @IsOptional()
  onFailure?: string;

  @IsOptional()
  timeout?: number;
}

class RetryPolicyDto implements RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}

class WorkflowDefinitionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];

  @IsObject()
  @IsOptional()
  variables?: Record<string, any> = {};

  @IsObject()
  errorHandling: {
    retryPolicy: RetryPolicyDto;
    onError: string;
  };
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsString()
  description: string;

  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  definition: WorkflowDefinitionDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> = {};
}