import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestrationService } from './orchestration.service';
import { OrchestrationController } from './orchestration.controller';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { ServiceRegistryModule } from '../service-registry/service-registry.module';
import { MessageRoutingModule } from '../message-routing/message-routing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, WorkflowExecution]),
    ServiceRegistryModule,
    MessageRoutingModule,
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}