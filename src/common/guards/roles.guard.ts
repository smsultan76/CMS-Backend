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

    console.log('🔐 ROLES GUARD DEBUG:');
    console.log('Required Roles:', requiredRoles);

    const request = context.switchToHttp().getRequest();
    console.log('User from request:', request.user);
    console.log('User role:', request.user?.role);

    // If no roles are required, allow access
    if (!requiredRoles) {
      console.log('No roles required, allowing access');
      return true;
    }

    const { user } = request;
    
    // Check if user exists and has a role
    if (!user || !user.role) {
      console.log('User or user role missing');
      throw new ForbiddenException('User role not found');
    }

    // Check if user has required role
    const hasRole = requiredRoles.includes(user.role);
    console.log('User has required role:', hasRole);
    
    if (!hasRole) {
      console.log('Access denied - insufficient role');
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`
      );
    }

    console.log('Access granted');
    return true;
  }
}