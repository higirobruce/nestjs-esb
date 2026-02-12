import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ServiceCall, CallStatus, HttpMethod } from './entities/service-call.entity';
import { ServiceCallDto, DirectServiceCallDto, ServiceCallResponseDto } from './dto/service-call.dto';
import { ServiceRegistryService } from '../service-registry/service-registry.service';
import { ClientRegistryService } from '../client-registry/client-registry.service';
import { ProjectionService } from './projection.service';

@Injectable()
export class ServiceIntegrationService {
  private readonly logger = new Logger(ServiceIntegrationService.name);

  constructor(
    @InjectRepository(ServiceCall)
    private serviceCallRepository: Repository<ServiceCall>,
    private httpService: HttpService,
    private serviceRegistry: ServiceRegistryService,
    private clientRegistry: ClientRegistryService,
    private eventEmitter: EventEmitter2,
    private projectionService: ProjectionService,
  ) {}

  async callService(serviceCallDto: ServiceCallDto): Promise<ServiceCallResponseDto> {
    // Get service from registry
    const service = await this.serviceRegistry.getService(
      serviceCallDto.serviceName,
      serviceCallDto.serviceVersion,
    );

    if (!service) {
      throw new NotFoundException(`Service ${serviceCallDto.serviceName} not found`);
    }

    // Construct full URL
    const baseUrl = service.endpoint.replace(/\/$/, '');
    const path = serviceCallDto.path.startsWith('/') ? serviceCallDto.path : `/${serviceCallDto.path}`;
    const fullUrl = `${baseUrl}${path}`;
    // Create direct call DTO
    const directCallDto: DirectServiceCallDto = {
      url: fullUrl,
      method: serviceCallDto.method,
      correlationId: serviceCallDto.correlationId,
      clientId: serviceCallDto.clientId,
      headers: serviceCallDto.headers,
      queryParams: serviceCallDto.queryParams,
      body: serviceCallDto.body,
      maxRetries: serviceCallDto.maxRetries,
      timeoutMs: serviceCallDto.timeoutMs,
    };

    return this.makeDirectCall(directCallDto, service.name, service.version);
  }

  async makeDirectCall(
    directCallDto: DirectServiceCallDto,
    serviceName?: string,
    serviceVersion?: string,
  ): Promise<ServiceCallResponseDto> {
    const correlationId = directCallDto.correlationId || uuidv4();
    
    // Validate client if provided
    if (directCallDto.clientId) {
      try {
        await this.clientRegistry.getClient(directCallDto.clientId);
      } catch (error) {
        throw new BadRequestException(`Invalid client ID: ${directCallDto.clientId}`);
      }
    }

    // Create service call record
    const serviceCall = this.serviceCallRepository.create({
      correlationId,
      clientId: directCallDto.clientId,
      serviceName: serviceName || 'direct-call',
      serviceVersion,
      endpointUrl: directCallDto.url,
      httpMethod: directCallDto.method,
      requestHeaders: directCallDto.headers,
      requestBody: directCallDto.body,
      queryParams: directCallDto.queryParams,
      maxRetries: directCallDto.maxRetries || 0,
      status: CallStatus.PENDING,
    });

    const savedCall = await this.serviceCallRepository.save(serviceCall);

    try {
      const startTime = Date.now();
      const response = await this.executeHttpCall(directCallDto, savedCall);
      const executionTime = Date.now() - startTime;

      // Apply projection if requested
      let projectedResponse = response.data;
      let requestedFields: string[] | null = null;

      if (serviceName && (directCallDto.responseProjection || directCallDto.clientId)) {
        try {
          requestedFields = await this.projectionService.resolveProjection(
            serviceName,
            directCallDto.clientId,
            directCallDto.responseProjection,
          );

          if (requestedFields && requestedFields.length > 0) {
            // Validate against schema if enabled (default true)
            const shouldValidate =
              directCallDto.responseProjection?.validateAgainstSchema !== false;

            if (shouldValidate) {
              await this.projectionService.validateProjection(
                serviceName,
                requestedFields,
              );
            }

            // Apply projection
            projectedResponse = this.projectionService.applyProjection(
              response.data,
              requestedFields,
            );

            this.logger.debug(
              `Applied projection with ${requestedFields.length} fields to service call ${savedCall.id}`,
            );
          }
        } catch (projectionError) {
          this.logger.error(
            `Projection failed for service call ${savedCall.id}: ${projectionError.message}`,
          );
          // Re-throw projection errors (validation failures should fail the call)
          throw projectionError;
        }
      }

      // Update service call record with success
      await this.updateServiceCall(savedCall.id, {
        status: CallStatus.SUCCESS,
        responseStatus: response.status,
        responseHeaders: response.headers,
        responseBody: response.data, // Always store full response
        projectedResponseBody: projectedResponse, // Store projected version
        requestedFields: requestedFields || undefined,
        executionTimeMs: executionTime,
      });

      this.eventEmitter.emit('service.call.success', {
        serviceCall: savedCall,
        response,
        executionTime,
      });

      return {
        id: savedCall.id,
        correlationId,
        status: response.status,
        headers: response.headers,
        data: projectedResponse, // Return projected version to client
        executionTimeMs: executionTime,
        retryCount: savedCall.retryCount,
      };
    } catch (error) {
      const executionTime = Date.now() - Date.now();
      
      // Update service call record with failure
      await this.updateServiceCall(savedCall.id, {
        status: CallStatus.FAILED,
        errorMessage: error.message,
        executionTimeMs: executionTime,
        responseStatus: error.response?.status,
        responseHeaders: error.response?.headers,
        responseBody: error.response?.data,
      });

      this.eventEmitter.emit('service.call.error', {
        serviceCall: savedCall,
        error,
        executionTime,
      });

      throw error;
    }
  }

  private async executeHttpCall(
    directCallDto: DirectServiceCallDto,
    serviceCall: ServiceCall,
  ): Promise<any> {

    const maxRetries = directCallDto.maxRetries || 0;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(`Retrying service call ${serviceCall.id}, attempt ${attempt}/${maxRetries}`);

          // Update retry count
          await this.updateServiceCall(serviceCall.id, {
            retryCount: attempt,
          });

          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }

        this.logger.debug(`Making ${directCallDto.method} request to: ${directCallDto.url}`);

        const config: any = {
          method: directCallDto.method,
          url: directCallDto.url,
          timeout: directCallDto.timeoutMs || 30000,
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': directCallDto.correlationId,
            ...directCallDto.headers,
          },
          // Disable SSL verification for development (remove in production)
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        };

        if (directCallDto.queryParams) {
          config.params = directCallDto.queryParams;
        }

        if (directCallDto.body && ['POST', 'PUT', 'PATCH'].includes(directCallDto.method)) {
          config.data = directCallDto.body;
        }

        const response = await firstValueFrom(this.httpService.request(config));
        this.logger.debug(`Request successful: ${response.status} ${response.statusText}`);
        return response;
      } catch (error) {
        lastError = error;

        // Enhanced error logging
        if (error.code === 'EPROTO') {
          this.logger.error(
            `SSL/TLS protocol error when calling ${directCallDto.url}. ` +
            `This usually means there's a protocol mismatch (HTTP vs HTTPS). ` +
            `Verify the endpoint URL scheme matches the actual service protocol.`
          );
        } else if (error.code) {
          this.logger.error(`Request failed with code ${error.code}: ${error.message}`);
        } else if (error.response) {
          this.logger.error(`Request failed with status ${error.response.status}: ${error.response.statusText}`);
        } else {
          this.logger.error(`Request failed: ${error.message}`);
        }

        if (attempt === maxRetries) {
          // Final attempt failed
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          break;
        }
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    // Don't retry configuration/protocol errors
    if (error.code === 'EPROTO' || error.code === 'ENOTFOUND' || error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
      return false;
    }

    // Don't retry client errors (4xx) except for specific cases
    if (error.response?.status >= 400 && error.response?.status < 500) {
      // Retry on rate limiting and timeout
      return [408, 429].includes(error.response.status);
    }

    // Retry on server errors (5xx) and network errors
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT' ||
           error.response?.status >= 500;
  }

  private async updateServiceCall(id: string, updates: Partial<ServiceCall>): Promise<void> {
    await this.serviceCallRepository.update(id, updates);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getServiceCall(id: string): Promise<ServiceCall> {
    const serviceCall = await this.serviceCallRepository.findOne({ where: { id } });
    if (!serviceCall) {
      throw new NotFoundException('Service call not found');
    }
    return serviceCall;
  }

  async getServiceCalls(correlationId?: string, serviceName?: string): Promise<ServiceCall[]> {
    const query: any = {};
    
    if (correlationId) {
      query.correlationId = correlationId;
    }
    
    if (serviceName) {
      query.serviceName = serviceName;
    }

    return this.serviceCallRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async getServiceCallStats(serviceName?: string): Promise<any> {
    const query = this.serviceCallRepository.createQueryBuilder('sc');
    
    if (serviceName) {
      query.where('sc.serviceName = :serviceName', { serviceName });
    }

    const [totalCalls, successCalls, failedCalls, avgExecutionTime] = await Promise.all([
      query.getCount(),
      query.clone().where('sc.status = :status', { status: CallStatus.SUCCESS }).getCount(),
      query.clone().where('sc.status = :status', { status: CallStatus.FAILED }).getCount(),
      query.clone()
        .select('AVG(sc.executionTimeMs)', 'avg')
        .where('sc.executionTimeMs IS NOT NULL')
        .getRawOne(),
    ]);

    return {
      totalCalls,
      successCount: successCalls,
      failedCount: failedCalls,
      successRate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
      averageExecutionTimeMs: avgExecutionTime?.avg ? Math.round(avgExecutionTime.avg) : null,
    };
  }
}
