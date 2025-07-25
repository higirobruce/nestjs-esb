import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('message_logs')
export class MessageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column()
  source: string;

  @Column({ nullable: true })
  destination: string;

  @Column()
  messageType: string;

  @Column('jsonb')
  payload: any;

  @Column('jsonb')
  headers: Record<string, any>;

  @Column()
  status: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}
