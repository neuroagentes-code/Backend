import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, ValidateNested, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Type, Transform, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../entities/company.entity';

// Validador personalizado para términos aceptados
function IsTrue(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTrue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value === true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Debe aceptar los términos y condiciones';
        },
      },
    });
  };
}

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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1' || value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsTrue({ message: 'Debe aceptar los términos y condiciones para completar el registro' })
  termsAccepted: boolean;
}

// DTO para el registro completo (empresa + contacto)
export class CompleteRegistrationDto {
  // Datos de la empresa
  @ApiProperty({ description: 'Datos de la empresa' })
  @ValidateNested()
  @Type(() => CreateCompanyDto)
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

// DTO para respuestas de Company con URLs firmadas
export class CompanyResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  country: string;

  @Expose()
  department: string;

  @Expose()
  city: string;

  @Expose()
  address?: string;

  @Expose()
  phone?: string;

  @Expose()
  website?: string;

  @Expose()
  description?: string;

  @Expose()
  legalRepresentativeName?: string;

  @Expose()
  legalRepresentativeId?: string;

  @Expose()
  isActive: boolean;

  // URLs originales (file keys)
  @Expose()
  chamberOfCommerceUrl?: string;

  @Expose()
  rutUrl?: string;

  @Expose()
  legalRepresentativeIdUrl?: string;

  // URLs firmadas listas para usar
  @Expose()
  chamberOfCommerceSignedUrl?: string;

  @Expose()
  rutSignedUrl?: string;

  @Expose()
  legalRepresentativeIdSignedUrl?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<Company>) {
    Object.assign(this, partial);
  }
}
