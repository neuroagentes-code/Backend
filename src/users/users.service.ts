import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, IsNull } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { UserPermissions } from '../common/interfaces/permissions.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { EmailService } from '../common/services/email.service';
import { RolePermissionsService } from '../common/services/role-permissions.service';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async create(createUserDto: CreateUserDto, profileImageFile?: Express.Multer.File, createdById?: string): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email, deletedAt: IsNull() }
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }

    // Subir imagen de perfil si se proporciona
    let profileImageUrl: string | undefined;
    if (profileImageFile) {
      profileImageUrl = await this.fileUploadService.uploadFile(
        profileImageFile,
        'profile-images'
      );
    }

    // Generar contraseña temporal
    const temporaryPassword = crypto.randomBytes(8).toString('hex');

    const user = this.userRepository.create({
      ...createUserDto,
      password: temporaryPassword,
      profileImage: profileImageUrl,
      createdById,
      // ✅ NUEVO: Los permisos vienen automáticamente del rol via role_permissions table
    });

    const savedUser = await this.userRepository.save(user);

    this.sendWelcomeEmail(savedUser, temporaryPassword);

    return this.createUserResponseWithImageUrl(savedUser);
  }

  async findAll(filters: GetUsersFilterDto & { createdById?: string }): Promise<PaginatedResponse<UserResponseDto>> {
    const { page = 1, limit = 10, search, role, area, isActive, companyId, createdById } = filters;

    const where: FindOptionsWhere<User> = {
      deletedAt: IsNull(),
    };

    if (createdById) {
      where.createdById = createdById;
    }

    if (search) {
      const searchConditions = [
        { firstName: Like(`%${search}%`), deletedAt: IsNull(), ...(createdById ? { createdById } : {}) },
        { lastName: Like(`%${search}%`), deletedAt: IsNull(), ...(createdById ? { createdById } : {}) },
        { email: Like(`%${search}%`), deletedAt: IsNull(), ...(createdById ? { createdById } : {}) },
      ];
      const [users, total] = await Promise.all([
        this.userRepository.find({
          where: searchConditions,
          relations: ['company'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' }
        }),
        this.userRepository.count({ where: searchConditions })
      ]);
      return await this.buildPaginatedResponse(users, total, page, limit);
    }

    // Aplicar filtros específicos
    if (role) where.role = role;
    if (area) where.area = area;
    if (isActive !== undefined) where.isActive = isActive;
    if (companyId) where.company = { id: companyId };

    const [users, total] = await this.userRepository.findAndCount({
      where,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return await this.buildPaginatedResponse(users, total, page, limit);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['company']
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.createUserResponseWithImageUrl(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, profileImageFile?: Express.Multer.File): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si el email ya existe (excluyendo el usuario actual)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email, deletedAt: IsNull() }
      });

      if (existingUser) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }
    }

    // Subir nueva imagen de perfil si se proporciona
    if (profileImageFile) {
      updateUserDto.profileImage = await this.fileUploadService.uploadFile(
        profileImageFile,
        'profile-images'
      );
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    await this.userRepository.update(id, updateUserDto);
    
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['company']
    });

    return this.createUserResponseWithImageUrl(updatedUser);
  }

  async toggleStatus(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = !user.isActive;
    const updatedUser = await this.userRepository.save(user);

    return this.createUserResponseWithImageUrl(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Soft delete
    user.deletedAt = new Date();
    await this.userRepository.save(user);
  }

  private async buildPaginatedResponse(
    users: User[], 
    total: number, 
    page: number, 
    limit: number
  ): Promise<PaginatedResponse<UserResponseDto>> {
    // Generar URLs firmadas para todos los usuarios con imágenes en paralelo
    const userDtos = await Promise.all(
      users.map(user => this.createUserResponseWithImageUrl(user))
    );
    
    return new PaginatedResponse(
      userDtos,
      total,
      page,
      limit
    );
  }

  /**
   * Crea un UserResponseDto con la URL firmada de la imagen de perfil y permisos por rol
   */
  private async createUserResponseWithImageUrl(user: User): Promise<UserResponseDto> {
    const userDto = new UserResponseDto(user);
    
    // Si el usuario tiene imagen de perfil, generar URL firmada
    if (user.profileImage) {
      try {
        // Generar URL firmada válida por 24 horas
        userDto.profileImageUrl = await this.fileUploadService.getSignedUrl(
          user.profileImage, 
          86400 // 24 horas en segundos
        );
      } catch (error) {
        console.error(`Error generating signed URL for user ${user.id}:`, error);
        // Si hay error, dejar profileImageUrl como undefined
        userDto.profileImageUrl = undefined;
      }
    }

    // ✅ NUEVO: Obtener permisos basados en el rol del usuario
    try {
      userDto.permissions = await this.rolePermissionsService.getPermissionsByRole(user.role);
    } catch (error) {
      console.error(`Error getting role permissions for user ${user.id} with role ${user.role}:`, error);
      // En caso de error, mantener permisos vacíos por seguridad
      userDto.permissions = {
        agents: { view: false, create: false, edit: false, delete: false },
        integrations: { view: false, create: false, edit: false, delete: false },
        channels: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        subscriptions: { view: false, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      };
    }
    
    return userDto;
  }

  private async sendWelcomeEmail(user: User, temporaryPassword: string): Promise<void> {
    try {
      // Usar el método sendWelcomeEmail existente del EmailService
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.fullName,
        temporaryPassword
      );
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // No lanzar error para no bloquear la creación del usuario
    }
  }
}
