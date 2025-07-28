import { SetMetadata, createParamDecorator, ExecutionContext, applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { JwtAuthGuard, FlexibleAuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';

// Public route decorator - skips authentication
export const Public = () => SetMetadata('isPublic', true);

// Roles decorator - specifies required roles
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Get current user decorator
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Combined decorator for JWT authentication with optional roles
export const Auth = (...roles: UserRole[]) => {
  const decorators = [UseGuards(JwtAuthGuard)];
  
  if (roles.length > 0) {
    decorators.push(Roles(...roles), UseGuards(RolesGuard));
  }
  
  return applyDecorators(...decorators);
};

// Combined decorator for flexible authentication (JWT or API Key) with optional roles
export const FlexibleAuth = (...roles: UserRole[]) => {
  const decorators = [UseGuards(FlexibleAuthGuard)];
  
  if (roles.length > 0) {
    decorators.push(Roles(...roles), UseGuards(RolesGuard));
  }
  
  return applyDecorators(...decorators);
};

// Admin only decorator
export const AdminOnly = () => Auth(UserRole.ADMIN);

// Service only decorator
export const ServiceOnly = () => Auth(UserRole.SERVICE);

// Admin or Service decorator
export const AdminOrService = () => Auth(UserRole.ADMIN, UserRole.SERVICE);
