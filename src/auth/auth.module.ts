import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { JwtAuthGuard } from './guards/auth.guards';
import { RolesGuard } from './guards/roles.guard';
import { UserSeeder } from './seeders/user.seeder';
import { ClientRegistryModule } from '../client-registry/client-registry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientRegistryModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const expirationTime = configService.get<string>('JWT_EXPIRATION_TIME') || '3600';
        const expiresIn = expirationTime.includes('s') || expirationTime.includes('m') || expirationTime.includes('h') 
          ? expirationTime 
          : `${expirationTime}s`;
        
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key',
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    ApiKeyStrategy,
    JwtAuthGuard,
    RolesGuard,
    UserSeeder,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, UserSeeder],
})
export class AuthModule {}
