import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    minLength: 6,
    example: 'password123',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address for BackOffice access',
    example: 'client@neuroagentes.co',
    format: 'email'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password - must be provided',
    example: 'SecurePassword123!',
    minLength: 1
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'client@neuroagentes.co',
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'user'
    }
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export class AuthMeResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@neuroagentes.co',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  lastName: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  fullName: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+57 300 1234567',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Imagen de perfil del usuario',
    example: 'https://storage.example.com/profile.jpg',
    nullable: true,
  })
  profileImage: string | null;

  @ApiProperty({
    description: 'ID de la empresa a la que pertenece el usuario',
    example: 'abc12345-...',
    nullable: true,
  })
  companyId: string | null;

  @ApiProperty({
    description: 'Indica si la cuenta del usuario está activa',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la cuenta',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class LoginErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 401
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message for security - generic message',
    example: 'Email or password incorrect'
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Unauthorized'
  })
  error: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address for password recovery',
    example: 'user@neuroagentes.co',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@neuroagentes.co',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'OTP code received in email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'OTP code is required' })
  @MinLength(6, { message: 'OTP code must be 6 digits' })
  @IsString()
  otpCode: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@neuroagentes.co',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'OTP code for verification',
    example: '123456',
  })
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  otpCode: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewSecurePassword123!',
  })
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}
