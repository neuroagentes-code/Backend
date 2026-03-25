import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission } from '../decorators/permissions.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Los super admins tienen acceso completo a todas las funcionalidades
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Verificar permisos específicos
    const hasPermission = requiredPermissions.every(permission => {
      const userModulePermissions = user.permissions?.[permission.module];
      
      if (!userModulePermissions) {
        return false;
      }

      return userModulePermissions[permission.action] === true;
    });

    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos suficientes para realizar esta acción');
    }

    return true;
  }
}
