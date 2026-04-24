import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, UserArea } from '../../auth/entities/user.entity';

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
  @IsString()
  companyId?: string;
}
