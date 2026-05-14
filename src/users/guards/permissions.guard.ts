import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission } from '../decorators/permissions.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { RolePermissionsService } from '../../common/services/role-permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => RolePermissionsService))
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    console.log('Request recibido en PermissionsGuard:', {
      headers: req.headers,
      body: req.body,
      user: req.user
    });
    const { user } = req;
    console.log('Usuario autenticado:', user);

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Los super admins tienen acceso completo a todas las funcionalidades
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Obtener permisos por rol y usuario
    const rolePermissions = await this.rolePermissionsService.getPermissionsByRole(user.role, user.id);
    console.log('Permisos obtenidos por rol y usuario:', rolePermissions);


    // Verificar permisos específicos
    const hasPermission = requiredPermissions.every(permission => {
      const userModulePermissions = rolePermissions?.[permission.module];
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
