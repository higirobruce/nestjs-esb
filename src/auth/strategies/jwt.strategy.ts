import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserStatus } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    this.logger.log(`JWT Strategy initialized with secret: ${jwtSecret.substring(0, 10)}...`);
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);
    
    const user = await this.authService.findUserById(payload.sub);
    
    if (!user) {
      this.logger.warn(`User not found for ID: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(`User ${user.username} is not active. Status: ${user.status}`);
      throw new UnauthorizedException('Account is not active');
    }

    if (user.isAccountLocked()) {
      this.logger.warn(`User ${user.username} account is locked`);
      throw new UnauthorizedException('Account is locked');
    }

    this.logger.debug(`JWT validation successful for user: ${user.username}`);
    return user;
  }
}
