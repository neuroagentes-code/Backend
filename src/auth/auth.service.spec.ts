import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, LoginDto } from './dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@neuroagentes.co',
    password: '$2a$12$testHashedPassword', // Test hashed password
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: jest.fn(),
    hashPassword: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    const testPassword = 'password123'; // Test password
    const loginDto: LoginDto = {
      email: 'test@neuroagentes.co',
      password: testPassword,
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const user = { ...mockUser };
      user.comparePassword = jest.fn().mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email or password incorrect'),
      );
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      // Arrange
      const user = { ...mockUser };
      user.comparePassword = jest.fn().mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(user);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email or password incorrect'),
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email or password incorrect'),
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email or password incorrect'),
      );
    });

    it('should normalize email to lowercase and trim whitespace', async () => {
      // Arrange
      const user = { ...mockUser };
      user.comparePassword = jest.fn().mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(user);

      const loginWithSpacesDto: LoginDto = {
        email: '  TEST@NEUROAGENTES.CO  ',
        password: 'password123',
      };

      // Act
      await service.login(loginWithSpacesDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@neuroagentes.co' },
        select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive'],
      });
    });
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@neuroagentes.co',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.USER,
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // User doesn't exist
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(createUserDto);

      // Assert
      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      const user = { ...mockUser };
      user.comparePassword = jest.fn().mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.validateUser('test@neuroagentes.co', 'password123');

      // Assert
      expect(result).toEqual(user);
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      const user = { ...mockUser };
      user.comparePassword = jest.fn().mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.validateUser('test@neuroagentes.co', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent@neuroagentes.co', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      // Act
      const result = await service.validateUser('test@neuroagentes.co', 'password123');

      // Assert
      expect(result).toBeNull();
    });
  });
});
