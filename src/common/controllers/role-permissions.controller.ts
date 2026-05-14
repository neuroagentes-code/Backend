import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Body, Param, Put } from '@nestjs/common';
import { RolePermissionsService } from '../services/role-permissions.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { UsersService } from '../../users/users.service';


@ApiTags('Role Permissions')
@Controller('role-permissions')
@UseGuards(JwtAuthGuard)
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
    private readonly usersService: UsersService,
  ) {}

  // 1. Obtener permisos por rol y usuario autenticado
  @Get('/:userId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener permisos del usuario por ID',
    description: 'Devuelve los permisos del usuario especificado por su ID. Requiere autenticación JWT.'
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'ID del usuario para consultar permisos',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos del usuario obtenidos correctamente',
    schema: {
      example: {
        agents: { view: true, create: false, edit: false, delete: false },
        integrations: { view: true, create: false, edit: false, delete: false },
        // ...otros módulos
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    schema: {
      example: { error: 'Usuario no encontrado' }
    }
  })
  async getPermissionsForUser(@Param('userId') userId: string) {
    const user = await this.usersService['userRepository'].findOne({ where: { id: userId } });
    if (!user) {
      return { error: 'Usuario no encontrado' };
    }
    return this.rolePermissionsService.getPermissionsByRole(user.role, user.id);
  }

  // 2. Activar/desactivar permiso para usuario
  @Put('toggle')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Modificar un permiso individual para un usuario',
    description: 'Modifica el permiso individual (view, create, edit, delete) para un usuario y módulo específico.'
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso actualizado correctamente',
    schema: { example: { success: true } }
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
    schema: { example: { error: 'Permiso no encontrado' } }
  })
  togglePermission(
    @Body('userId') userId: string,
    @Body('permissionKey') permissionKey: string,
    @Body('action') action: 'view' | 'create' | 'edit' | 'delete',
    @Body('value') value: boolean,
  ) {
    return this.rolePermissionsService.togglePermission(userId, permissionKey, action, value);
  }

  // 3. Crear nuevo permiso
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo permiso',
    description: 'Crea un nuevo permiso para todos los roles con valores por defecto (false).'
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso creado correctamente',
    schema: { example: { success: true } }
  })
  createPermission(
    @Body('key') key: string,
    @Body('description') description: string,
  ) {
    return this.rolePermissionsService.createPermission(key, description);
  }
}
