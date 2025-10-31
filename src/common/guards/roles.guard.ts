import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    if (!requiredRoles) {
      console.log('No roles required, allowing access');
      return true;
    }const { user } = request;
    
    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }
    const hasRole = requiredRoles.includes(user.role);
    
    if (!hasRole) {
      console.log('Access denied');
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`
      );
    }

    console.log('Access granted');
    return true;
  }
}