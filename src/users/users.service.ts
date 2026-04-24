import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, IsNull } from 'typeorm';
import { User, UserPermissions, UserRole } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { EmailService } from '../common/services/email.service';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto, profileImageFile?: Express.Multer.File): Promise<UserResponseDto> {
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

    // Establecer permisos por defecto según el rol
    const defaultPermissions = this.getDefaultPermissions(createUserDto.role);

    const user = this.userRepository.create({
      ...createUserDto,
      password: temporaryPassword,
      profileImage: profileImageUrl,
      permissions: { ...defaultPermissions, ...createUserDto.permissions },
    });

    const savedUser = await this.userRepository.save(user);

    // Enviar email con contraseña temporal
    await this.sendWelcomeEmail(savedUser, temporaryPassword);

    return this.createUserResponseWithImageUrl(savedUser);
  }

  async findAll(filters: GetUsersFilterDto): Promise<PaginatedResponse<UserResponseDto>> {
    const { page = 1, limit = 10, search, role, area, isActive, companyId } = filters;
    
    const where: FindOptionsWhere<User> = {
      deletedAt: IsNull(),
    };

    if (search) {
      const searchConditions = [
        { firstName: Like(`%${search}%`), deletedAt: IsNull() },
        { lastName: Like(`%${search}%`), deletedAt: IsNull() },
        { email: Like(`%${search}%`), deletedAt: IsNull() },
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

    // Merge permissions
    if (updateUserDto.permissions) {
      updateUserDto.permissions = { ...user.permissions, ...updateUserDto.permissions };
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

  async updatePermissions(id: string, permissions: UserPermissions): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.permissions = { ...user.permissions, ...permissions };
    const updatedUser = await this.userRepository.save(user);

    return this.createUserResponseWithImageUrl(updatedUser);
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
   * Crea un UserResponseDto con la URL firmada de la imagen de perfil
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
    
    return userDto;
  }

  private getDefaultPermissions(role: UserRole): UserPermissions {
    const basePermissions: UserPermissions = {
      agents: { view: false, create: false, edit: false, delete: false },
      integrations: { view: false, create: false, edit: false, delete: false },
      channels: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      subscriptions: { view: false, create: false, edit: false, delete: false },
      profile: { view: true, create: false, edit: true, delete: false },
    };

    switch (role) {
      case UserRole.SUPER_ADMIN:
        return {
          agents: { view: true, create: true, edit: true, delete: true },
          integrations: { view: true, create: true, edit: true, delete: true },
          channels: { view: true, create: true, edit: true, delete: true },
          users: { view: true, create: true, edit: true, delete: true },
          subscriptions: { view: true, create: true, edit: true, delete: true },
          profile: { view: true, create: true, edit: true, delete: true },
        };

      case UserRole.ADMIN:
        return {
          agents: { view: true, create: true, edit: true, delete: false },
          integrations: { view: true, create: true, edit: true, delete: false },
          channels: { view: true, create: true, edit: true, delete: false },
          users: { view: true, create: true, edit: true, delete: false },
          subscriptions: { view: true, create: false, edit: false, delete: false },
          profile: { view: true, create: false, edit: true, delete: false },
        };

      case UserRole.MANAGER:
        return {
          agents: { view: true, create: true, edit: true, delete: false },
          integrations: { view: true, create: false, edit: false, delete: false },
          channels: { view: true, create: true, edit: true, delete: false },
          users: { view: true, create: false, edit: false, delete: false },
          subscriptions: { view: true, create: false, edit: false, delete: false },
          profile: { view: true, create: false, edit: true, delete: false },
        };

      case UserRole.USER:
      default:
        return basePermissions;
    }
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
