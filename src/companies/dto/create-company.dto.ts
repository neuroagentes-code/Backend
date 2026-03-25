import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Nombre de la empresa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'País', default: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Departamento' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Ciudad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Dirección', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Teléfono', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Sitio web', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Nombre del representante legal', required: false })
  @IsOptional()
  @IsString()
  legalRepresentativeName?: string;

  @ApiProperty({ description: 'Identificación del representante legal', required: false })
  @IsOptional()
  @IsString()
  legalRepresentativeId?: string;

  @ApiProperty({ description: 'Aceptación de términos y condiciones' })
  @IsBoolean()
  termsAccepted: boolean;
}

// DTO para el registro completo (empresa + contacto)
export class CompleteRegistrationDto {
  // Datos de la empresa
  @ApiProperty({ description: 'Datos de la empresa' })
  company: CreateCompanyDto;

  // Datos del contacto principal
  @ApiProperty({ description: 'Email del contacto principal' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Confirmación de contraseña' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({ description: 'Nombre del contacto' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Apellido del contacto' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Teléfono del contacto', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: 'Posición del contacto', required: false })
  @IsOptional()
  @IsString()
  position?: string;
}
