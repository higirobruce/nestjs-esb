import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateUserDto,
  LoginResponseDto,
  RefreshTokenDto,
  GenerateApiKeyDto,
} from './dto/auth.dto';
import { User } from './entities/user.entity';
import { LocalAuthGuard } from './guards/auth.guards';
import { Public, Auth, AdminOnly, GetUser } from './decorators/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }

  @Auth()
  @Get('profile')
  async getProfile(@GetUser() user: User): Promise<User> {
    return user;
  }

  @Auth()
  @Put('profile')
  async updateProfile(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.authService.updateUser(user.id, updateUserDto);
  }

  @Auth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Auth()
  @Post('generate-api-key')
  @HttpCode(HttpStatus.OK)
  async generateApiKey(
    @GetUser() user: User,
    @Body() generateApiKeyDto: GenerateApiKeyDto,
  ): Promise<{ apiKey: string; message: string }> {
    const apiKey = await this.authService.generateApiKey(user.id);
    return {
      apiKey,
      message: 'API key generated successfully. Please store it securely as it cannot be retrieved again.',
    };
  }

  @Auth()
  @Get('api-key')
  async getApiKey(@GetUser() user: User): Promise<{ apiKey: string | null; hasApiKey: boolean }> {
    const fullUser = await this.authService.findUserById(user.id);
    return {
      apiKey: fullUser?.apiKey || null,
      hasApiKey: !!fullUser?.apiKey,
    };
  }

  @Auth()
  @Delete('revoke-api-key')
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(@GetUser() user: User): Promise<{ message: string }> {
    await this.authService.revokeApiKey(user.id);
    return { message: 'API key revoked successfully' };
  }

  // Admin endpoints
  @AdminOnly()
  @Get('users')
  async getAllUsers(): Promise<User[]> {
    return this.authService.getAllUsers();
  }

  @AdminOnly()
  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<User> {
    const user = await this.authService.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @AdminOnly()
  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.authService.updateUser(id, updateUserDto);
  }

  @AdminOnly()
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.authService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @AdminOnly()
  @Post('users/:id/generate-api-key')
  @HttpCode(HttpStatus.OK)
  async generateApiKeyForUser(@Param('id') id: string): Promise<{ apiKey: string; message: string }> {
    const apiKey = await this.authService.generateApiKey(id);
    return {
      apiKey,
      message: 'API key generated successfully for user',
    };
  }

  @AdminOnly()
  @Delete('users/:id/revoke-api-key')
  @HttpCode(HttpStatus.OK)
  async revokeApiKeyForUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.authService.revokeApiKey(id);
    return { message: 'API key revoked successfully for user' };
  }
}
