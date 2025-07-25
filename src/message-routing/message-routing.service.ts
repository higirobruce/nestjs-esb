import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { MessageLog } from './entities/message-log.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EsbMessage } from '../common/types/message.interface';
import { Route } from './entities/message-routing.entity';

@Injectable()
export class MessageRoutingService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(MessageLog)
    private messageLogRepository: Repository<MessageLog>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createRoute(createRouteDto: CreateRouteDto): Promise<Route> {
    const route = this.routeRepository.create(createRouteDto);
    const savedRoute = await this.routeRepository.save(route);

    this.eventEmitter.emit('route.created', savedRoute);
    return savedRoute;
  }

  async getAllRoutes(): Promise<Route[]> {
    return this.routeRepository.find({ order: { priority: 'DESC' } });
  }

  async getRoute(id: string): Promise<Route> {
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return route;
  }

  async updateRoute(id: string, updateData: Partial<Route>): Promise<Route> {
    const route = await this.getRoute(id);
    Object.assign(route, updateData);
    return this.routeRepository.save(route);
  }

  async deleteRoute(id: string): Promise<void> {
    const result = await this.routeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Route not found');
    }
  }

  async routeMessage(sendMessageDto: SendMessageDto): Promise<EsbMessage> {
    const message: EsbMessage = {
      id: uuidv4(),
      correlationId: sendMessageDto.correlationId || uuidv4(),
      source: sendMessageDto.source,
      destination: sendMessageDto.destination,
      messageType: sendMessageDto.messageType,
      payload: sendMessageDto.payload,
      headers: sendMessageDto.headers || {},
      timestamp: new Date(),
      priority: sendMessageDto.priority || 0,
      ttl: sendMessageDto.ttl,
    };

    // Log the message
    await this.logMessage(message, 'RECEIVED');

    // Find matching routes
    const routes = await this.findMatchingRoutes(message);

    if (routes.length === 0) {
      await this.logMessage(message, 'NO_ROUTE');
      this.eventEmitter.emit('message.no.route', message);
      return message;
    }

    // Process routes
    for (const route of routes) {
      await this.processRoute(message, route);
    }

    this.eventEmitter.emit('message.routed', message);
    return message;
  }

  private async findMatchingRoutes(message: EsbMessage): Promise<Route[]> {
    const activeRoutes = await this.routeRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC' },
    });

    return activeRoutes.filter(route => this.matchesRoute(message, route));
  }

  private matchesRoute(message: EsbMessage, route: Route): boolean {
    // Simple pattern matching - can be extended with more sophisticated logic
    const patternRegex = new RegExp(route.pattern.replace(/\*/g, '.*'));
    
    if (!patternRegex.test(message.messageType)) {
      return false;
    }

    // Check conditions if any
    if (route.conditions) {
      return this.evaluateConditions(message, route.conditions);
    }

    return true;
  }

  private evaluateConditions(message: EsbMessage, conditions: Record<string, any>): boolean {
    // Simple condition evaluation - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (key.startsWith('header.')) {
        const headerKey = key.substring(7);
        if (message.headers[headerKey] !== value) {
          return false;
        }
      } else if (key === 'source' && message.source !== value) {
        return false;
      }
    }
    return true;
  }

  private async processRoute(message: EsbMessage, route: Route): Promise<void> {
    try {
      // Apply transformations if any
      let processedMessage = { ...message };
      if (route.transformations && route.transformations.length > 0) {
        processedMessage = await this.applyTransformations(processedMessage, route.transformations);
      }

      // Send to destinations
      for (const destination of route.destinations) {
        processedMessage.destination = destination;
        this.eventEmitter.emit('message.route.destination', {
          message: processedMessage,
          route: route.name,
          destination,
        });
      }

      await this.logMessage(message, 'ROUTED', route.name);
    } catch (error) {
      await this.logMessage(message, 'ERROR', undefined, error.message);
      this.eventEmitter.emit('message.route.error', { message, route, error });
    }
  }

  private async applyTransformations(message: EsbMessage, transformations: string[]): Promise<EsbMessage> {
    // Placeholder for transformation logic
    // In a real implementation, this would apply various transformations
    return message;
  }

  private async logMessage(
    message: EsbMessage,
    status: string,
    routeName?: string,
    errorMessage?: string,
  ): Promise<void> {
    const log = this.messageLogRepository.create({
      messageId: message.id,
      correlationId: message.correlationId,
      source: message.source,
      destination: message.destination,
      messageType: message.messageType,
      payload: message.payload,
      headers: message.headers,
      status,
      errorMessage,
    });

    await this.messageLogRepository.save(log);
  }

  async getMessageLogs(correlationId?: string): Promise<MessageLog[]> {
    const query: any = {};
    if (correlationId) {
      query.correlationId = correlationId;
    }

    return this.messageLogRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }
}
