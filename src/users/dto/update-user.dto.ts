import { IsString, IsOptional, IsEnum, IsBoolean, IsEmail } from 'class-validator';
import { UserRole, UserArea } from '../../auth/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El nombre es requerido' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido es requerido' })
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser válido' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserArea, { message: 'El área debe ser válida' })
  area?: UserArea;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
