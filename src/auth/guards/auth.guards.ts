import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      this.logger.debug(`JWT Auth failed - Error: ${err?.message}, Info: ${info?.message || info}`);
      
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format');
      }
      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid API key');
    }
    return user;
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Return user if valid, null if not authenticated
    return user;
  }
}

@Injectable()
export class FlexibleAuthGuard extends AuthGuard(['jwt', 'api-key']) {
  private readonly logger = new Logger(FlexibleAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Log authentication attempt details for debugging
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-api-key'];

    this.logger.debug(`Auth attempt - Authorization header: ${authHeader ? authHeader.substring(0, 20) + '...' : 'none'}, X-API-Key: ${apiKeyHeader ? 'present' : 'none'}`);

    if (err) {
      this.logger.debug(`Auth error: ${err.message}`);
      throw err;
    }

    if (!user) {
      this.logger.debug(`Auth failed - Info: ${JSON.stringify(info)}`);
      // Provide more specific error message based on what was attempted
      if (authHeader?.startsWith('ApiKey ')) {
        throw new UnauthorizedException('Invalid API key or account not active');
      } else if (authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid or expired JWT token');
      } else if (apiKeyHeader) {
        throw new UnauthorizedException('Invalid API key or account not active');
      } else {
        throw new UnauthorizedException('Authentication required - provide Bearer token, ApiKey, or X-API-Key header');
      }
    }

    this.logger.debug(`Auth successful for user: ${user.username || user.id}`);
    return user;
  }
}
