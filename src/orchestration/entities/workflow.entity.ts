import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  version: string;

  @Column('text')
  description: string;

  @Column('jsonb')
  definition: {
    steps: WorkflowStep[];
    variables: Record<string, any>;
    errorHandling: {
      retryPolicy: RetryPolicy;
      onError: string;
    };
  };

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
  })
  status: WorkflowStatus;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'service_call' | 'condition' | 'parallel' | 'delay' | 'transform';
  config: Record<string, any>;
  onSuccess?: string;
  onFailure?: string;
  timeout?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}
