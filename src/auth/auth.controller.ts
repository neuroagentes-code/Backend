import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, AuthResponseDto, AuthMeResponseDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto';
import { LocalAuthGuard, JwtAuthGuard } from './guards/auth.guards';
import { GetUser, Public } from './decorators/auth.decorators';
import { User } from './entities/user.entity';
import { CompleteRegistrationDto } from '../companies/dto/create-company.dto';

@ApiTags('BackOffice Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login user - BackOffice Authentication',
    description: 'Authenticate user with email and password to access BackOffice dashboard'
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in - redirects to dashboard',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials - Email or password incorrect',
    schema: {
      example: {
        statusCode: 401,
        message: 'Email or password incorrect',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error - Empty email or password fields',
    schema: {
      example: {
        statusCode: 400,
        message: ['email should not be empty', 'password should not be empty'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many login attempts - Rate limit exceeded',
    schema: {
      example: {
        statusCode: 429,
        message: 'Too Many Requests',
        error: 'ThrottlerException: Too Many Requests'
      }
    }
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetUser() user: User): Promise<User> {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar sesión activa del usuario (Auth Me)',
    description: 'Verifica si el token JWT es válido y devuelve la información del usuario autenticado. Úsalo para comprobar si el usuario sigue logueado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión activa — el usuario está autenticado',
    type: AuthMeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado — token inválido, expirado o ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async getMe(@GetUser() user: User): Promise<AuthMeResponseDto> {
    return this.authService.getMe(user.id);
  }

  @Public()
  @Post('register-company')
  @UseInterceptors(FilesInterceptor('documents', 3)) // Máximo 3 archivos
  @ApiOperation({ 
    summary: 'Registro completo de empresa - Wizard de 3 pasos',
    description: 'Registra una nueva empresa con su contacto principal y documentos legales opcionales'
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa registrada exitosamente',
    schema: {
      example: {
        message: 'Registro completado con éxito. Bienvenido a NeuroAgentes.'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos o contraseñas no coinciden' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Ya existe un usuario con este email' 
  })
  async registerCompany(
    @Body(ValidationPipe) registrationDto: CompleteRegistrationDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ): Promise<{ message: string }> {
    return this.authService.completeRegistration(registrationDto, files);
  }

  // Password Recovery Endpoints
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({ 
    summary: 'Solicitar código de recuperación de contraseña',
    description: 'Envía un código OTP de 6 dígitos válido por 5 minutos al email registrado'
  })
  @ApiResponse({
    status: 200,
    description: 'Código enviado exitosamente',
    schema: {
      example: {
        message: 'Si el email está registrado, recibirás un código de verificación en tu bandeja de entrada.'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Email inválido',
    schema: {
      example: {
        statusCode: 400,
        message: ['Please provide a valid email address'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos - límite de velocidad excedido'
  })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código OTP',
    description: 'Valida el código OTP recibido por email para proceder con el cambio de contraseña'
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado correctamente',
    schema: {
      example: {
        message: 'Código verificado correctamente. Puedes proceder a cambiar tu contraseña.'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Código incorrecto o expirado',
    schema: {
      example: {
        statusCode: 400,
        message: 'El código ingresado es incorrecto o ha expirado. Por favor, solicita uno nuevo.',
        error: 'Bad Request'
      }
    }
  })
  async verifyOtp(
    @Body(ValidationPipe) verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string }> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description: 'Establece una nueva contraseña después de verificar el código OTP'
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    schema: {
      example: {
        message: 'Tu contraseña ha sido actualizada correctamente.'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error en validación - contraseñas no coinciden o código inválido',
    schema: {
      examples: {
        passwordMismatch: {
          summary: 'Contraseñas no coinciden',
          value: {
            statusCode: 400,
            message: 'Las contraseñas no coinciden',
            error: 'Bad Request'
          }
        },
        invalidOtp: {
          summary: 'Código OTP inválido',
          value: {
            statusCode: 400,
            message: 'El código ingresado es incorrecto o ha expirado. Por favor, solicita uno nuevo.',
            error: 'Bad Request'
          }
        }
      }
    }
  })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
