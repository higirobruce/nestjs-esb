import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  apiKey: string;

  @Column('simple-array')
  allowedServices: string[];

  @Column('jsonb', { nullable: true })
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('jsonb', { nullable: true })
  defaultProjections: {
    [serviceName: string]: {
      preset?: string;
      fields?: string[];
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivity: Date;
}
