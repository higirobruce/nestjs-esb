import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { UserStatus, UserRole } from '../entities/user.entity';
import { ClientRegistryService } from '../../client-registry/client-registry.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  private readonly logger = new Logger(ApiKeyStrategy.name);

  constructor(
    private authService: AuthService,
    private clientRegistryService: ClientRegistryService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      this.logger.debug('No API key provided in request');
      throw new UnauthorizedException('API key is required');
    }

    this.logger.debug(`Validating API key: ${apiKey.substring(0, 10)}...`);

    // First, try to find a user with this API key
    const user = await this.authService.findUserByApiKey(apiKey);

    if (user) {
      this.logger.debug(`Found user with API key: ${user.username}`);

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`User ${user.username} is not active`);
        throw new UnauthorizedException('Account is not active');
      }

      if (user.isAccountLocked()) {
        this.logger.warn(`User ${user.username} account is locked`);
        throw new UnauthorizedException('Account is locked');
      }

      return user;
    }

    // If no user found, try to find a client with this API key
    const client = await this.clientRegistryService.validateClient(apiKey);

    if (client) {
      this.logger.debug(`Found client with API key: ${client.name}`);

      // Attach a role to the client so it can pass role-based guards
      // Clients are treated as services in the authorization system
      return {
        ...client,
        role: UserRole.SERVICE,
      };
    }

    // Neither user nor client found with this API key
    this.logger.warn(`Invalid API key provided: ${apiKey.substring(0, 10)}...`);
    throw new UnauthorizedException('Invalid API key');
  }

  private extractApiKey(req: Request): string | null {
    // Check X-API-Key header
    const headerApiKey = req.headers['x-api-key'] as string;
    if (headerApiKey) {
      return headerApiKey;
    }

    // Check Authorization header with ApiKey scheme
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    const queryApiKey = req.query['api_key'] as string;
    if (queryApiKey) {
      return queryApiKey;
    }

    return null;
  }
}
