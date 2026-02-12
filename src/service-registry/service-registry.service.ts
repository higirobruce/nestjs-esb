import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterServiceDto } from './dto/register-service.dto';
import { UpdateServiceDto } from './dto/update-service-registry.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { ServiceStatus, Environment, ProtocolType } from '../common/enums';
import { Service } from './entities/service-registry.entity';

@Injectable()
export class ServiceRegistryService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    private eventEmitter: EventEmitter2,
  ) {}

  async registerService(registerServiceDto: RegisterServiceDto): Promise<Service> {
    const existingService = await this.serviceRepository.findOne({
      where: { name: registerServiceDto.name, version: registerServiceDto.version },
    });

    if (existingService) {
      throw new ConflictException('Service with this name and version already exists');
    }

    const service = this.serviceRepository.create(registerServiceDto);
    const savedService = await this.serviceRepository.save(service);

    this.eventEmitter.emit('service.registered', savedService);
    return savedService;
  }

  async getService(name: string, version?: string): Promise<Service> {
    const query: any = { name };
    if (version) query.version = version;

    const service = await this.serviceRepository.findOne({ where: query });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async getAllServices(): Promise<Service[]> {
    return this.serviceRepository.find();
  }

  async getActiveServices(): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { status: ServiceStatus.ACTIVE },
    });
  }

  async updateServiceStatus(id: string, status: ServiceStatus): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.status = status;
    const updatedService = await this.serviceRepository.save(service);

    this.eventEmitter.emit('service.status.updated', updatedService);
    return updatedService;
  }

  async unregisterService(id: string): Promise<void> {
    const result = await this.serviceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Service not found');
    }

    this.eventEmitter.emit('service.unregistered', { id });
  }

  async updateHealthCheck(id: string): Promise<void> {
    await this.serviceRepository.update(id, {
      lastHealthCheck: new Date(),
    });
  }

  async getServicesByEnvironment(environment: Environment): Promise<Service[]> {
    return this.serviceRepository.find({ where: { environment } });
  }

  async getServicesByProtocol(protocol: ProtocolType): Promise<Service[]> {
    return this.serviceRepository.find({ where: { protocol } });
  }

  async getServicesByOwner(ownerSystem: string): Promise<Service[]> {
    return this.serviceRepository.find({ where: { ownerSystem } });
  }

  async queryServices(query: QueryServiceDto): Promise<Service[]> {
    const whereClause: any = {};

    if (query.name) whereClause.name = query.name;
    if (query.version) whereClause.version = query.version;
    if (query.status) whereClause.status = query.status;
    if (query.environment) whereClause.environment = query.environment;
    if (query.protocol) whereClause.protocol = query.protocol;
    if (query.ownerSystem) whereClause.ownerSystem = query.ownerSystem;
    if (query.invocationRole) whereClause.invocationRole = query.invocationRole;

    return this.serviceRepository.find({ where: whereClause });
  }

  async updateService(id: string, updateDto: UpdateServiceDto): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    Object.assign(service, updateDto);
    const updatedService = await this.serviceRepository.save(service);

    this.eventEmitter.emit('service.updated', updatedService);
    return updatedService;
  }
}
