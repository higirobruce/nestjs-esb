import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServiceRegistryModule } from './service-registry/service-registry.module';
import { ClientRegistryModule } from './client-registry/client-registry.module';
import { MessageRoutingModule } from './message-routing/message-routing.module';
import { OrchestrationModule } from './orchestration/orchestration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'esb_db',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    EventEmitterModule.forRoot(),
    ServiceRegistryModule,
    ClientRegistryModule,
    MessageRoutingModule,
    OrchestrationModule,
  ],
})
export class AppModule {}