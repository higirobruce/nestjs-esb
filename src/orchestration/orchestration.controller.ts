import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { OrchestrationService } from './orchestration.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { WorkflowStatus } from './entities/workflow.entity';

@Controller('orchestration')
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  @Post('workflows')
  async createWorkflow(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.orchestrationService.createWorkflow(createWorkflowDto);
  }

  @Get('workflows')
  async getAllWorkflows() {
    return this.orchestrationService.getAllWorkflows();
  }

  @Get('workflows/:id')
  async getWorkflow(@Param('id') id: string) {
    return this.orchestrationService.getWorkflow(id);
  }

  @Patch('workflows/:id/status')
  async updateWorkflowStatus(@Param('id') id: string, @Body('status') status: WorkflowStatus) {
    return this.orchestrationService.updateWorkflowStatus(id, status);
  }

  @Post('execute')
  async executeWorkflow(@Body() executeWorkflowDto: ExecuteWorkflowDto) {
    return this.orchestrationService.executeWorkflow(executeWorkflowDto);
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    return this.orchestrationService.getExecution(id);
  }

  @Get('workflows/:workflowId/executions')
  async getExecutionsByWorkflow(@Param('workflowId') workflowId: string) {
    return this.orchestrationService.getExecutionsByWorkflow(workflowId);
  }

  @Patch('executions/:id/cancel')
  async cancelExecution(@Param('id') id: string) {
    return this.orchestrationService.cancelExecution(id);
  }
}
