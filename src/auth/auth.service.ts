import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

import { User, UserRole, UserStatus } from './entities/user.entity';
import {
  RegisterDto,
  LoginResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existing) {
      if (existing.username === registerDto.username) {
        throw new ConflictException('Username already exists');
      }
      if (existing.email === registerDto.email) {
        throw new ConflictException('Email already exists');
      }
    }

    // Create new user
    const user = this.userRepository.create({
      ...registerDto,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    });

    // Generate API key for the user
    user.generateApiKey();

    const savedUser = await this.userRepository.save(user);

    this.eventEmitter.emit('user.registered', { user: savedUser });
    this.logger.log(`User registered: ${savedUser.username}`);

    return savedUser;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    if (user.isAccountLocked()) {
      throw new UnauthorizedException('Account is locked due to too many failed attempts');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      // Increment failed attempts
      user.incrementFailedAttempts();
      await this.userRepository.save(user);

      this.eventEmitter.emit('user.login.failed', {
        user,
        reason: 'invalid_password',
      });

      return null;
    }

    // Reset failed attempts on successful login
    user.resetFailedAttempts();
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    this.eventEmitter.emit('user.login.success', { user });

    return user;
  }

  async login(user: User): Promise<LoginResponseDto> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        hasApiKey: !!user.apiKey,
      },
      expiresIn: this.getJwtExpirationTime(),
    };
  }

  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      });

      const user = await this.findUserById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserByApiKey(apiKey: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { apiKey } });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await user.validatePassword(changePasswordDto.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = changePasswordDto.newPassword;
    user.passwordChangedAt = new Date();
    await this.userRepository.save(user);

    this.eventEmitter.emit('user.password.changed', { user });
    this.logger.log(`Password changed for user: ${user.username}`);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.findUserByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepository.save(user);

    this.eventEmitter.emit('user.password.reset.requested', {
      user,
      token: user.resetPasswordToken,
    });

    this.logger.log(`Password reset requested for user: ${user.username}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: resetPasswordDto.token },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = resetPasswordDto.newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = new Date();
    user.resetFailedAttempts(); // Reset any account locks

    await this.userRepository.save(user);

    this.eventEmitter.emit('user.password.reset.completed', { user });
    this.logger.log(`Password reset completed for user: ${user.username}`);
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for email conflicts if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findUserByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    this.eventEmitter.emit('user.updated', { user: updatedUser });
    this.logger.log(`User updated: ${updatedUser.username}`);

    return updatedUser;
  }

  async generateApiKey(userId: string): Promise<string> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.generateApiKey();
    await this.userRepository.save(user);

    this.eventEmitter.emit('user.api_key.generated', { user });
    this.logger.log(`API key generated for user: ${user.username}`);

    return user.apiKey;
  }

  async revokeApiKey(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.apiKey = null;
    await this.userRepository.save(user);

    this.eventEmitter.emit('user.api_key.revoked', { user });
    this.logger.log(`API key revoked for user: ${user.username}`);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    this.eventEmitter.emit('user.deleted', { user });
    this.logger.log(`User deleted: ${user.username}`);
  }

  private generateRefreshToken(userId: string): string {
    const payload = { sub: userId, type: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      expiresIn: '7d',
    });
  }

  private getJwtExpirationTime(): number {
    return parseInt(this.configService.get<string>('JWT_EXPIRATION_TIME') || '3600');
  }
}
