import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { UserStatus } from '../entities/user.entity';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);
    
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const user = await this.authService.findUserByApiKey(apiKey);
    
    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    if (user.isAccountLocked()) {
      throw new UnauthorizedException('Account is locked');
    }

    return user;
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
