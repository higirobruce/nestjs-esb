import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { Workflow, WorkflowStatus, WorkflowStep } from './entities/workflow.entity';
import { WorkflowExecution, ExecutionStatus, ExecutionLogEntry } from './entities/workflow-execution.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { ServiceRegistryService } from '../service-registry/service-registry.service';
import { MessageRoutingService } from '../message-routing/message-routing.service';

@Injectable()
export class OrchestrationService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    private serviceRegistryService: ServiceRegistryService,
    private messageRoutingService: MessageRoutingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createWorkflow(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
    // Validate workflow definition
    await this.validateWorkflowDefinition(createWorkflowDto.definition);

    const workflow = this.workflowRepository.create(createWorkflowDto);
    const savedWorkflow = await this.workflowRepository.save(workflow);

    this.eventEmitter.emit('workflow.created', savedWorkflow);
    return savedWorkflow;
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return this.workflowRepository.find();
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({ where: { id } });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async updateWorkflowStatus(id: string, status: WorkflowStatus): Promise<Workflow> {
    const workflow = await this.getWorkflow(id);
    workflow.status = status;
    return this.workflowRepository.save(workflow);
  }

  async executeWorkflow(executeWorkflowDto: ExecuteWorkflowDto): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(executeWorkflowDto.workflowId);

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Workflow is not active');
    }

    const execution = this.executionRepository.create({
      workflowId: workflow.id,
      workflow,
      correlationId: executeWorkflowDto.correlationId || uuidv4(),
      status: ExecutionStatus.PENDING,
      currentStep: workflow.definition.steps[0]?.id || '',
      context: {
        ...workflow.definition.variables,
        ...executeWorkflowDto.initialContext,
      },
      executionLog: [],
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Start execution asynchronously
    setImmediate(() => this.processExecution(savedExecution));

    this.eventEmitter.emit('workflow.execution.started', savedExecution);
    return savedExecution;
  }

  async getExecution(id: string): Promise<WorkflowExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id },
      relations: ['workflow'],
    });

    if (!execution) {
      throw new NotFoundException('Workflow execution not found');
    }

    return execution;
  }

  async getExecutionsByWorkflow(workflowId: string): Promise<WorkflowExecution[]> {
    return this.executionRepository.find({
      where: { workflowId },
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelExecution(id: string): Promise<WorkflowExecution> {
    const execution = await this.getExecution(id);
    
    if (execution.status === ExecutionStatus.RUNNING) {
      execution.status = ExecutionStatus.CANCELLED;
      await this.executionRepository.save(execution);
      this.eventEmitter.emit('workflow.execution.cancelled', execution);
    }

    return execution;
  }

  private async processExecution(execution: WorkflowExecution): Promise<void> {
    try {
      execution.status = ExecutionStatus.RUNNING;
      await this.executionRepository.save(execution);

      const workflow = execution.workflow;
      let currentStepId = execution.currentStep;

      while (currentStepId && execution.status === ExecutionStatus.RUNNING) {
        const step = workflow.definition.steps.find(s => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step ${currentStepId} not found in workflow definition`);
        }

        const stepResult = await this.executeStep(execution, step);
        
        if (stepResult.success) {
          currentStepId = step.onSuccess || this.getNextStep(workflow.definition.steps, currentStepId);
        } else {
          currentStepId = step.onFailure || null;
          if (!currentStepId) {
            execution.status = ExecutionStatus.FAILED;
            execution.errorMessage = stepResult.error;
            break;
          }
        }

        execution.currentStep = currentStepId || '';
        await this.executionRepository.save(execution);
      }

      if (execution.status === ExecutionStatus.RUNNING && !currentStepId) {
        execution.status = ExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
      }

      await this.executionRepository.save(execution);
      this.eventEmitter.emit('workflow.execution.completed', execution);

    } catch (error) {
      execution.status = ExecutionStatus.FAILED;
      execution.errorMessage = error.message;
      await this.executionRepository.save(execution);
      this.eventEmitter.emit('workflow.execution.failed', { execution, error });
    }
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    const logEntry: ExecutionLogEntry = {
      timestamp: new Date(),
      stepId: step.id,
      stepName: step.name,
      status: 'started',
    };

    try {
      let result: any;

      switch (step.type) {
        case 'service_call':
          result = await this.executeServiceCall(execution, step);
          break;
        case 'condition':
          result = await this.executeCondition(execution, step);
          break;
        case 'parallel':
          result = await this.executeParallel(execution, step);
          break;
        case 'delay':
          result = await this.executeDelay(execution, step);
          break;
        case 'transform':
          result = await this.executeTransform(execution, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      logEntry.status = 'completed';
      logEntry.output = result;
      logEntry.duration = Date.now() - startTime;

      // Update execution context with step result
      if (result && typeof result === 'object') {
        Object.assign(execution.context, result);
      }

      execution.executionLog.push(logEntry);
      await this.executionRepository.save(execution);

      return { success: true };

    } catch (error) {
      logEntry.status = 'failed';
      logEntry.error = error.message;
      logEntry.duration = Date.now() - startTime;

      execution.executionLog.push(logEntry);
      await this.executionRepository.save(execution);

      return { success: false, error: error.message };
    }
  }

  private async executeServiceCall(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { serviceName, method, payload } = step.config;
    
    // Get service from registry
    const service = await this.serviceRegistryService.getService(serviceName);
    
    // Send message through routing
    const message = await this.messageRoutingService.routeMessage({
      source: 'orchestration',
      destination: service.endpoint,
      messageType: `${serviceName}.${method}`,
      payload: this.interpolatePayload(payload, execution.context),
      correlationId: execution.correlationId,
    });

    // In a real implementation, you would wait for the response
    // For now, we'll simulate a response
    return { success: true, data: message };
  }

  private async executeCondition(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { expression } = step.config;
    // Simple expression evaluation - in production, use a proper expression engine
    const result = this.evaluateExpression(expression, execution.context);
    return { conditionResult: result };
  }

  private async executeParallel(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { branches } = step.config;
    const promises = branches.map((branch: any) => 
      this.executeStep(execution, { ...step, ...branch })
    );
    
    const results = await Promise.allSettled(promises);
    return { parallelResults: results };
  }

  private async executeDelay(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { duration } = step.config;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { delayed: duration };
  }

  private async executeTransform(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { transformations } = step.config;
    let result = { ...execution.context };

    for (const transformation of transformations) {
      result = this.applyTransformation(result, transformation);
    }

    return result;
  }

  private interpolatePayload(payload: any, context: Record<string, any>): any {
    if (typeof payload === 'string') {
      return payload.replace(/\${(\w+)}/g, (match, key) => context[key] || match);
    }
    
    if (Array.isArray(payload)) {
      return payload.map(item => this.interpolatePayload(item, context));
    }
    
    if (typeof payload === 'object' && payload !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(payload)) {
        result[key] = this.interpolatePayload(value, context);
      }
      return result;
    }
    
    return payload;
  }

  private evaluateExpression(expression: string, context: Record<string, any>): boolean {
    // Simple expression evaluation - replace with proper expression engine in production
    try {
      const func = new Function('context', `with(context) { return ${expression}; }`);
      return func(context);
    } catch (error) {
      return false;
    }
  }

  private applyTransformation(data: any, transformation: any): any {
    // Simple transformation logic - extend as needed
    const { type, config } = transformation;
    
    switch (type) {
      case 'map':
        return config.mapping.reduce((acc: any, mapping: any) => {
          acc[mapping.target] = data[mapping.source];
          return acc;
        }, {});
      case 'filter':
        return Object.fromEntries(
          Object.entries(data).filter(([key]) => config.fields.includes(key))
        );
      default:
        return data;
    }
  }

  private getNextStep(steps: WorkflowStep[], currentStepId: string): string | null {
    const currentIndex = steps.findIndex(step => step.id === currentStepId);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1].id : null;
  }

  private async validateWorkflowDefinition(definition: any): Promise<void> {
    // Validate that all referenced services exist
    for (const step of definition.steps) {
      if (step.type === 'service_call' && step.config.serviceName) {
        try {
          await this.serviceRegistryService.getService(step.config.serviceName);
        } catch (error) {
          throw new BadRequestException(`Service ${step.config.serviceName} not found in registry`);
        }
      }
    }

    // Validate step references
    const stepIds = new Set(definition.steps.map((step: any) => step.id));
    for (const step of definition.steps) {
      if (step.onSuccess && !stepIds.has(step.onSuccess)) {
        throw new BadRequestException(`Invalid onSuccess reference: ${step.onSuccess}`);
      }
      if (step.onFailure && !stepIds.has(step.onFailure)) {
        throw new BadRequestException(`Invalid onFailure reference: ${step.onFailure}`);
      }
    }
  }

  @OnEvent('message.route.destination')
  async handleRouteDestination(payload: any): Promise<void> {
    // Handle routed messages that might be responses to orchestration calls
    const { message, destination } = payload;
    
    if (message.correlationId) {
      // Find execution by correlation ID and update context
      const executions = await this.executionRepository.find({
        where: { correlationId: message.correlationId, status: ExecutionStatus.RUNNING },
      });

      for (const execution of executions) {
        execution.context[`response_${message.source}`] = message.payload;
        await this.executionRepository.save(execution);
      }
    }
  }
}