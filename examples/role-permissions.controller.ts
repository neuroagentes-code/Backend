import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { RolePermissionsService } from '../src/common/services/role-permissions.service';
import { JwtAuthGuard } from '../src/auth/guards/auth.guards';
import { UserRole } from '../src/auth/entities/user.entity';

@Controller('admin/role-permissions')
@UseGuards(JwtAuthGuard)
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  /**
   * 📋 Obtener todos los permisos agrupados por rol
   */
  @Get()
  async getAllRolePermissions() {
    const permissions = await this.rolePermissionsService.getAllRolePermissions();
    return { success: true, data: permissions };
  }

  /**
   * 👤 Obtener permisos de un rol específico
   */
  @Get('role/:role')
  async getRolePermissions(@Param('role') role: UserRole) {
    const permissions = await this.rolePermissionsService.getPermissionsByRole(role);
    return { success: true, data: { role, permissions } };
  }

  /**
   * ✏️ Actualizar permiso específico de un rol
   */
  @Patch('role/:role/module/:module')
  async updateRolePermission(
    @Param('role') role: UserRole,
    @Param('module') module: string,
    @Body() updateDto: {
      view?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
      updatedBy?: string;
    }
  ) {
    await this.rolePermissionsService.updateRolePermission(role, module, updateDto, updateDto.updatedBy);
    
    return { 
      success: true, 
      message: `Permissions updated for role ${role} in module ${module}` 
    };
  }

  /**
   * 🆕 Agregar nuevo módulo para todos los roles
   */
  @Post('module')
  async addNewModule(
    @Body() addModuleDto: {
      module: string;
      permissions: {
        [key in UserRole]: {
          view: boolean;
          create: boolean;
          edit: boolean;
          delete: boolean;
        };
      };
      createdBy?: string;
    }
  ) {
    await this.rolePermissionsService.addModuleForAllRoles(
      addModuleDto.module,
      addModuleDto.permissions,
      addModuleDto.createdBy
    );

    return {
      success: true,
      message: `Module '${addModuleDto.module}' added for all roles with specified permissions`,
    };
  }

  /**
   * 📊 Estadísticas de permisos para dashboard
   */
  @Get('stats')
  async getPermissionsStats() {
    const stats = await this.rolePermissionsService.getPermissionsStats();
    return { success: true, data: stats };
  }

  /**
   * 🔍 Verificar permiso específico de un rol (para debugging)
   */
  @Get('check/:role/:module/:action')
  async checkRolePermission(
    @Param('role') role: UserRole,
    @Param('module') module: string,
    @Param('action') action: 'view' | 'create' | 'edit' | 'delete',
  ) {
    const hasPermission = await this.rolePermissionsService.hasRolePermission(role, module, action);
    
    return {
      success: true,
      data: {
        role,
        module,
        action,
        hasPermission,
      },
    };
  }

  /**
   * 🔄 Inicializar permisos por defecto (solo para desarrollo/setup)
   */
  @Post('initialize')
  async initializeDefaultPermissions() {
    await this.rolePermissionsService.initializeDefaultPermissions();
    
    return {
      success: true,
      message: 'Default role permissions initialized successfully',
    };
  }
}