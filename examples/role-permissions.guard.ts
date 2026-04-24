import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { RolePermissionsService } from '../src/common/services/role-permissions.service';

export interface RequiredPermission {
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete';
}

/**
 * Decorator para especificar permisos requeridos por rol
 * @example @RequirePermission({ module: 'users', action: 'create' })
 */
export const RequirePermission = (permission: RequiredPermission) => 
  Reflector.createDecorator<RequiredPermission>({ key: 'required_permission', transform: (value) => value })(permission);

/**
 * 🔐 Guard que verifica permisos basados en el rol del usuario
 * 
 * ✅ Uso: Combinar con @RequirePermission decorator
 * @example 
 * @UseGuards(JwtAuthGuard, RolePermissionsGuard)
 * @RequirePermission({ module: 'users', action: 'create' })
 * async createUser() { ... }
 */
@Injectable()
export class RolePermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.checkPermission(context);
  }

  private async checkPermission(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      'required_permission', 
      context.getHandler()
    );

    // Si no se especifica permiso, permitir acceso
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // Verificar que el usuario esté autenticado
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      // Verificar permiso usando el servicio
      const hasPermission = await this.rolePermissionsService.hasRolePermission(
        user.role,
        requiredPermission.module,
        requiredPermission.action
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermission.module}.${requiredPermission.action} for role ${user.role}`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new ForbiddenException(
        `Error checking permissions: ${error.message}`
      );
    }
  }
}

/**
 * 👑 Guard que verifica que el usuario tenga al menos cierto rol
 * @example @RequireRole(UserRole.ADMIN)
 */
export const RequireRole = (minRole: UserRole) => 
  Reflector.createDecorator<UserRole>({ key: 'required_role', transform: (value) => value })(minRole);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<UserRole>(
      'required_role', 
      context.getHandler()
    );

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRequiredRole = this.checkRoleHierarchy(user.role, requiredRole);
    
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRole}, Current: ${user.role}`
      );
    }

    return true;
  }

  /**
   * Verifica la jerarquía de roles
   * SUPER_ADMIN > ADMIN > MANAGER > USER
   */
  private checkRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.MANAGER]: 2,
      [UserRole.ADMIN]: 3,
      [UserRole.SUPER_ADMIN]: 4,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}