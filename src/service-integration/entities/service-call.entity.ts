import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CallStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

@Entity('service_calls')
@Index('IDX_service_calls_correlation_id', ['correlationId'])
@Index('IDX_service_calls_service_name', ['serviceName'])
@Index('IDX_service_calls_status', ['status'])
@Index('IDX_service_calls_created_at', ['createdAt'])
export class ServiceCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'correlation_id', nullable: true })
  correlationId: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column({ name: 'service_version', nullable: true })
  serviceVersion: string;

  @Column({ name: 'endpoint_url' })
  endpointUrl: string;

  @Column({ name: 'http_method', type: 'enum', enum: HttpMethod })
  httpMethod: HttpMethod;

  @Column({ name: 'request_headers', type: 'jsonb', nullable: true })
  requestHeaders: Record<string, string>;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody: any;

  @Column({ name: 'query_params', type: 'jsonb', nullable: true })
  queryParams: Record<string, string>;

  @Column({ name: 'response_status', nullable: true })
  responseStatus: number;

  @Column({ name: 'response_headers', type: 'jsonb', nullable: true })
  responseHeaders: Record<string, string>;

  @Column({ name: 'response_body', type: 'jsonb', nullable: true })
  responseBody: any;

  @Column({ name: 'status', type: 'enum', enum: CallStatus, default: CallStatus.PENDING })
  status: CallStatus;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'execution_time_ms', nullable: true })
  executionTimeMs: number;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 0 })
  maxRetries: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
