import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  ServiceStatus,
  ProtocolType,
  SyncMode,
  ContractType,
  AuthType,
  RetryPolicy,
  FailureMode,
  InvocationRole,
  AuditLevel,
  Environment,
} from '../../common/enums';

@Entity('services')
@Index('IDX_services_name_version', ['name', 'version'], { unique: true })
@Index('IDX_services_owner_system', ['ownerSystem'])
@Index('IDX_services_environment', ['environment'])
@Index('IDX_services_protocol', ['protocol'])
@Index('IDX_services_status', ['status'])
@Index('IDX_services_invocation_role', ['invocationRole'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========== IDENTITY ==========
  @Column()
  name: string;

  @Column()
  version: string;

  @Column({ name: 'owner_system' })
  ownerSystem: string;

  @Column({
    type: 'enum',
    enum: Environment,
    default: Environment.DEVELOPMENT,
  })
  environment: Environment;

  // ========== INVOCATION ==========
  @Column({
    type: 'enum',
    enum: ProtocolType,
    default: ProtocolType.REST,
  })
  protocol: ProtocolType;

  @Column()
  endpoint: string;

  @Column({ nullable: true })
  operation: string;

  @Column({
    type: 'enum',
    enum: SyncMode,
    default: SyncMode.SYNC,
  })
  syncMode: SyncMode;

  // ========== CONTRACT (JSONB) ==========
  @Column('jsonb', { nullable: true })
  contractConfig: {
    requestSchema?: object | string;
    responseSchema?: object | string;
    errorSchema?: object | string;
    contractType?: ContractType;
  };

  // ========== PROJECTION PRESETS (JSONB) ==========
  @Column('jsonb', { nullable: true })
  projectionPresets: {
    minimal?: string[];
    standard?: string[];
    detailed?: string[];
    [key: string]: string[];
  };

  // ========== SEMANTICS (JSONB) ==========
  @Column('jsonb', { nullable: true })
  semanticsConfig: {
    canonicalMapping?: object;
    requiredFields?: string[];
    referenceData?: object;
  };

  // ========== SECURITY (JSONB) ==========
  @Column('jsonb', { nullable: true })
  authConfig: {
    authType: AuthType;
    authProvider?: string;
    requiredScopes?: string[];
    additionalConfig?: object;
  };

  // ========== RELIABILITY ==========
  @Column({ name: 'timeout_ms', nullable: true })
  timeoutMs: number;

  @Column('jsonb', { nullable: true })
  retryConfig: {
    retryPolicy: RetryPolicy;
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  };

  @Column({ default: false })
  idempotent: boolean;

  // ========== LIFECYCLE ==========
  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  status: ServiceStatus;

  @Column({ name: 'effective_date', type: 'timestamp', nullable: true })
  effectiveDate: Date;

  // ========== PERFORMANCE ==========
  @Column({ name: 'rate_limit', nullable: true })
  rateLimit: number;

  @Column({ name: 'sla_latency_ms', nullable: true })
  slaLatencyMs: number;

  @Column({
    type: 'enum',
    enum: FailureMode,
    default: FailureMode.FAIL_FAST,
  })
  failureMode: FailureMode;

  @Column({
    type: 'enum',
    enum: InvocationRole,
    default: InvocationRole.BOTH,
  })
  invocationRole: InvocationRole;

  // ========== GOVERNANCE (JSONB) ==========
  @Column('jsonb', { nullable: true })
  operationalConfig: {
    compensationSupported?: boolean;
    maintenanceWindow?: string;
    auditLevel?: AuditLevel;
    costCenter?: string;
    changeHistory?: Array<{
      version: string;
      date: string;
      changes: string;
      author: string;
    }>;
  };

  // ========== LEGACY (keep for extensibility) ==========
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('jsonb', { nullable: true })
  healthCheck: {
    url: string;
    interval: number;
    timeout: number;
  };

  // ========== TIMESTAMPS ==========
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_health_check', type: 'timestamp', nullable: true })
  lastHealthCheck: Date;
}
