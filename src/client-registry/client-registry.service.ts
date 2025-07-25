import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { RegisterClientDto } from './dto/register-client.dto';
import { Client } from './entities/client-registry.entity';

@Injectable()
export class ClientRegistryService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private eventEmitter: EventEmitter2,
  ) {}

  async registerClient(registerClientDto: RegisterClientDto): Promise<Client> {
    const existingClient = await this.clientRepository.findOne({
      where: { name: registerClientDto.name },
    });

    if (existingClient) {
      throw new ConflictException('Client with this name already exists');
    }

    const client = this.clientRepository.create({
      ...registerClientDto,
      apiKey: this.generateApiKey(),
    });

    const savedClient = await this.clientRepository.save(client);
    this.eventEmitter.emit('client.registered', savedClient);
    return savedClient;
  }

  async validateClient(apiKey: string): Promise<Client | null> {
    const client = await this.clientRepository.findOne({
      where: { apiKey, isActive: true },
    });

    if (client) {
      await this.updateLastActivity(client.id);
    }

    return client;
  }

  async getClient(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return this.clientRepository.find();
  }

  async updateClient(id: string, updateData: Partial<Client>): Promise<Client> {
    const client = await this.getClient(id);
    Object.assign(client, updateData);
    return this.clientRepository.save(client);
  }

  async deactivateClient(id: string): Promise<Client> {
    const client = await this.getClient(id);
    client.isActive = false;
    return this.clientRepository.save(client);
  }

  async regenerateApiKey(id: string): Promise<Client> {
    const client = await this.getClient(id);
    client.apiKey = this.generateApiKey();
    const updatedClient = await this.clientRepository.save(client);

    this.eventEmitter.emit('client.apikey.regenerated', updatedClient);
    return updatedClient;
  }

  private generateApiKey(): string {
    return `esb_${uuidv4().replace(/-/g, '')}`;
  }

  private async updateLastActivity(clientId: string): Promise<void> {
    await this.clientRepository.update(clientId, {
      lastActivity: new Date(),
    });
  }
}