import { IsEmail, IsString, IsOptional, IsEnum, IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserArea, UserPermissions } from '../../auth/entities/user.entity';

export class PermissionsDto {
  @IsOptional()
  @IsObject()
  agents?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  @IsOptional()
  @IsObject()
  integrations?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  @IsOptional()
  @IsObject()
  channels?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  @IsOptional()
  @IsObject()
  users?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  @IsOptional()
  @IsObject()
  subscriptions?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  @IsOptional()
  @IsObject()
  profile?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  email: string;

  @IsString({ message: 'El nombre es requerido' })
  firstName: string;

  @IsString({ message: 'El apellido es requerido' })
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsEnum(UserRole, { message: 'El rol debe ser válido' })
  role: UserRole;

  @IsOptional()
  @IsEnum(UserArea, { message: 'El área debe ser válida' })
  area?: UserArea;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions?: UserPermissions;

  @IsOptional()
  @IsString()
  companyId?: string;
}
