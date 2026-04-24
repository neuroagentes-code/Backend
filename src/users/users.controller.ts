import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequireUserPermission } from './decorators/permissions.decorator';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { UserPermissions } from '../auth/entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @RequireUserPermission('create')
  @UseInterceptors(FileInterceptor('profileImage', {
    fileFilter: (req, file, callback) => {
      const imageRegex = /\.(jpg|jpeg|png|gif)$/;
      if (!imageRegex.exec(file.originalname)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente.',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El email ya está en uso.' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, file);
  }

  @Get()
  @RequireUserPermission('view')
  @ApiOperation({ summary: 'Obtener lista de usuarios con filtros y paginación' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios obtenida exitosamente.',
    type: PaginatedResponse<UserResponseDto>
  })
  async findAll(@Query() filters: GetUsersFilterDto): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  @RequireUserPermission('view')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario encontrado.',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequireUserPermission('edit')
  @UseInterceptors(FileInterceptor('profileImage', {
    fileFilter: (req, file, callback) => {
      const imageRegex = /\.(jpg|jpeg|png|gif)$/;
      if (!imageRegex.exec(file.originalname)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario actualizado exitosamente.',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'El email ya está en uso.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Patch(':id/toggle-status')
  @RequireUserPermission('edit')
  @ApiOperation({ summary: 'Cambiar estado activo/inactivo del usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del usuario cambiado exitosamente.',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.toggleStatus(id);
  }

  @Patch(':id/permissions')
  @RequireUserPermission('edit')
  @ApiOperation({ summary: 'Actualizar permisos del usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permisos actualizados exitosamente.',
    type: UserResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() permissions: UserPermissions,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePermissions(id, permissions);
  }

  @Delete(':id')
  @RequireUserPermission('delete')
  @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado exitosamente' };
  }
}
