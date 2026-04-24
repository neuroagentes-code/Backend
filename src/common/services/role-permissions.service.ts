import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../../auth/entities/role-permission.entity';
import { UserRole } from '../../auth/entities/user.entity';
import { UserPermissions } from '../interfaces/permissions.interface';

interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
  ) {}

  /**
   * 🎯 Obtener permisos de un rol específico
   */
  async getPermissionsByRole(role: UserRole): Promise<UserPermissions> {
    const permissions = await this.rolePermissionsRepository.find({
      where: { role, isActive: true },
      order: { module: 'ASC' },
    });

    // Convertir a formato UserPermissions
    const result: any = {};
    
    permissions.forEach(permission => {
      result[permission.module] = {
        view: permission.canView,
        create: permission.canCreate,
        edit: permission.canEdit,
        delete: permission.canDelete,
      };
    });

    // Asegurar que existen todos los módulos necesarios
    const defaultModules = ['agents', 'integrations', 'channels', 'users', 'subscriptions', 'profile'];
    defaultModules.forEach(module => {
      if (!result[module]) {
        result[module] = { view: false, create: false, edit: false, delete: false };
      }
    });

    return result;
  }

  /**
   * 🔍 Verificar si un rol tiene permiso específico
   */
  async hasRolePermission(
    role: UserRole,
    module: string,
    action: 'view' | 'create' | 'edit' | 'delete'
  ): Promise<boolean> {
    const permission = await this.rolePermissionsRepository.findOne({
      where: { role, module, isActive: true },
    });

    if (!permission) return false;

    switch (action) {
      case 'view': return permission.canView;
      case 'create': return permission.canCreate;
      case 'edit': return permission.canEdit;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  }

  /**
   * ✏️ Actualizar permiso de un rol específico
   */
  async updateRolePermission(
    role: UserRole,
    module: string,
    permissions: Partial<ModulePermissions>,
    updatedBy?: string
  ): Promise<void> {
    let rolePermission = await this.rolePermissionsRepository.findOne({
      where: { role, module },
    });

    if (!rolePermission) {
      // Crear nuevo permiso si no existe
      rolePermission = this.rolePermissionsRepository.create({
        role,
        module,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        createdBy: updatedBy || 'system',
      });
    }

    // Actualizar permisos
    Object.assign(rolePermission, {
      canView: permissions.view !== undefined ? permissions.view : rolePermission.canView,
      canCreate: permissions.create !== undefined ? permissions.create : rolePermission.canCreate,
      canEdit: permissions.edit !== undefined ? permissions.edit : rolePermission.canEdit,
      canDelete: permissions.delete !== undefined ? permissions.delete : rolePermission.canDelete,
      updatedBy: updatedBy || 'system',
      isActive: true,
    });

    await this.rolePermissionsRepository.save(rolePermission);
  }

  /**
   * 🆕 Agregar nuevo módulo para todos los roles
   */
  async addModuleForAllRoles(
    module: string, 
    rolePermissions: Record<UserRole, ModulePermissions>,
    createdBy?: string
  ): Promise<void> {
    const permissions: Partial<RolePermission>[] = [];

    Object.entries(rolePermissions).forEach(([role, perms]) => {
      permissions.push({
        role: role as UserRole,
        module,
        canView: perms.view,
        canCreate: perms.create,
        canEdit: perms.edit,
        canDelete: perms.delete,
        description: `Permissions for ${module} module - ${role} role`,
        createdBy: createdBy || 'system',
        isActive: true,
      });
    });

    await this.rolePermissionsRepository.save(permissions);
  }

  /**
   * 📋 Obtener todos los permisos agrupados por rol
   */
  async getAllRolePermissions(): Promise<Record<UserRole, UserPermissions>> {
    const allPermissions = await this.rolePermissionsRepository.find({
      where: { isActive: true },
      order: { role: 'ASC', module: 'ASC' },
    });

    const result: any = {};

    // Inicializar todos los roles
    Object.values(UserRole).forEach(role => {
      result[role] = {};
    });

    // Agrupar por rol
    allPermissions.forEach(permission => {
      if (!result[permission.role]) {
        result[permission.role] = {};
      }
      
      result[permission.role][permission.module] = {
        view: permission.canView,
        create: permission.canCreate,
        edit: permission.canEdit,
        delete: permission.canDelete,
      };
    });

    return result;
  }

  /**
   * 🔄 Inicializar permisos por defecto
   */
  async initializeDefaultPermissions(): Promise<void> {
    const existingPermissions = await this.rolePermissionsRepository.count();
    
    if (existingPermissions > 0) {
      console.log('✅ Role permissions already exist, skipping initialization');
      return;
    }

    console.log('🚀 Initializing default role permissions...');

    const defaultPermissions: Record<UserRole, Record<string, ModulePermissions>> = {
      [UserRole.SUPER_ADMIN]: {
        agents: { view: true, create: true, edit: true, delete: true },
        integrations: { view: true, create: true, edit: true, delete: true },
        channels: { view: true, create: true, edit: true, delete: true },
        users: { view: true, create: true, edit: true, delete: true },
        subscriptions: { view: true, create: true, edit: true, delete: true },
        profile: { view: true, create: true, edit: true, delete: true },
      },
      [UserRole.ADMIN]: {
        agents: { view: true, create: true, edit: true, delete: false },
        integrations: { view: true, create: true, edit: true, delete: false },
        channels: { view: true, create: true, edit: true, delete: false },
        users: { view: true, create: true, edit: true, delete: false },
        subscriptions: { view: true, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      },
      [UserRole.MANAGER]: {
        agents: { view: true, create: true, edit: true, delete: false },
        integrations: { view: true, create: false, edit: false, delete: false },
        channels: { view: true, create: true, edit: true, delete: false },
        users: { view: true, create: false, edit: false, delete: false },
        subscriptions: { view: true, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      },
      [UserRole.USER]: {
        agents: { view: false, create: false, edit: false, delete: false },
        integrations: { view: false, create: false, edit: false, delete: false },
        channels: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        subscriptions: { view: false, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      },
    };

    const permissions: Partial<RolePermission>[] = [];

    Object.entries(defaultPermissions).forEach(([role, modules]) => {
      Object.entries(modules).forEach(([module, perms]) => {
        permissions.push({
          role: role as UserRole,
          module,
          canView: perms.view,
          canCreate: perms.create,
          canEdit: perms.edit,
          canDelete: perms.delete,
          description: `Default permissions for ${module} module - ${role} role`,
          createdBy: 'system_initialization',
          isActive: true,
        });
      });
    });

    await this.rolePermissionsRepository.save(permissions);
    console.log(`✅ Initialized ${permissions.length} default role permissions`);
  }

  /**
   * 📊 Obtener estadísticas de permisos
   */
  async getPermissionsStats(): Promise<{
    totalPermissions: number;
    permissionsByRole: { role: string; count: number }[];
    moduleUsage: { module: string; rolesWithAccess: number }[];
  }> {
    const stats = await this.rolePermissionsRepository
      .createQueryBuilder('rp')
      .select([
        'rp.role as role',
        'rp.module as module',
        'COUNT(*) as count'
      ])
      .where('rp.isActive = :isActive', { isActive: true })
      .groupBy('rp.role, rp.module')
      .getRawMany();

    const totalPermissions = await this.rolePermissionsRepository.count({ where: { isActive: true } });

    const permissionsByRole = Object.values(UserRole).map(role => ({
      role,
      count: stats.filter(s => s.role === role).length,
    }));

    const moduleStats = stats.reduce((acc: any, stat) => {
      if (!acc[stat.module]) {
        acc[stat.module] = 0;
      }
      acc[stat.module]++;
      return acc;
    }, {});

    const moduleUsage = Object.entries(moduleStats).map(([module, count]) => ({
      module,
      rolesWithAccess: count as number,
    }));

    return {
      totalPermissions,
      permissionsByRole,
      moduleUsage,
    };
  }
}