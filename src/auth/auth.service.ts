import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import { 
  CreateUserDto, 
  LoginDto, 
  AuthResponseDto, 
  ForgotPasswordDto, 
  VerifyOtpDto, 
  ResetPasswordDto 
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { CompleteRegistrationDto } from '../companies/dto/create-company.dto';
import { Company } from '../companies/entities/company.entity';
import { CompaniesService } from '../companies/companies.service';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly companiesService: CompaniesService,
    private readonly emailService: EmailService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create(createUserDto);
    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    // Generic error message for security
    const genericError = 'Email or password incorrect';
    
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(genericError);
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new UnauthorizedException(genericError);
    }

    return this.generateAuthResponse(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim() },
        select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive'],
      });

      if (user?.isActive && (await user.comparePassword(password))) {
        return user;
      }

      return null;
    } catch (error) {
      // Log error for debugging but don't expose details
      console.error('Error during user validation:', error);
      return null;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async completeRegistration(registrationDto: CompleteRegistrationDto): Promise<{ message: string }> {
    // Validar que las contraseñas coincidan
    if (registrationDto.password !== registrationDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Verificar si ya existe un usuario con ese email
    const existingUser = await this.userRepository.findOne({
      where: { email: registrationDto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario registrado con este email');
    }

    try {
      // Crear la empresa
      const company = await this.companiesService.create(registrationDto.company);

      // Crear el usuario asociado a la empresa
      const user = this.userRepository.create({
        email: registrationDto.email.toLowerCase().trim(),
        password: registrationDto.password,
        firstName: registrationDto.firstName,
        lastName: registrationDto.lastName,
        company: company,
        role: 'user' as any,
        isActive: true,
      });

      await this.userRepository.save(user);

      // Enviar email de bienvenida
      await this.emailService.sendWelcomeEmail(
        user.email,
        company.name,
        user.fullName,
      );

      return {
        message: 'Registro completado con éxito. Bienvenido a NeuroAgentes.',
      };
    } catch (error) {
      console.error('Error during complete registration:', error);
      
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Error al procesar el registro. Por favor intente nuevamente.');
    }
  }

  // Métodos para recuperación de contraseña
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    
    // Buscar el usuario por email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    // Por seguridad, siempre devolvemos el mismo mensaje, exista o no el usuario
    if (!user) {
      return { 
        message: 'Si el email está registrado, recibirás un código de verificación en tu bandeja de entrada.' 
      };
    }

    // Generar código OTP de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Establecer fecha de expiración (5 minutos)
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 5);

    // Guardar OTP y fecha de expiración en la base de datos
    user.otpCode = otpCode;
    user.otpExpiry = expirationDate;
    await this.userRepository.save(user);

    // Enviar email con código OTP
    try {
      await this.emailService.sendPasswordResetOTP(
        user.email, 
        otpCode, 
        user.firstName
      );
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // No lanzar error para no revelar si el email existe
    }

    return { 
      message: 'Si el email está registrado, recibirás un código de verificación en tu bandeja de entrada.' 
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    const { email, otpCode } = verifyOtpDto;
    
    const user = await this.userRepository.findOne({
      where: { 
        email: email.toLowerCase().trim(),
        otpCode: otpCode,
        otpExpiry: MoreThan(new Date()),
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El código ingresado es incorrecto o ha expirado. Por favor, solicita uno nuevo.'
      );
    }

    return { message: 'Código verificado correctamente. Puedes proceder a cambiar tu contraseña.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, otpCode, newPassword, confirmPassword } = resetPasswordDto;

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Buscar usuario con OTP válido
    const user = await this.userRepository.findOne({
      where: { 
        email: email.toLowerCase().trim(),
        otpCode: otpCode,
        otpExpiry: MoreThan(new Date()),
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El código ingresado es incorrecto o ha expirado. Por favor, solicita uno nuevo.'
      );
    }

    // Actualizar contraseña y limpiar campos OTP
    user.password = newPassword; // Se hasheará automáticamente por el @BeforeUpdate
    user.otpCode = null;
    user.otpExpiry = null;
    
    await this.userRepository.save(user);

    return { message: 'Tu contraseña ha sido actualizada correctamente.' };
  }
}
