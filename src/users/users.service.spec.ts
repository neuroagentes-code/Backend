import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole, UserArea } from '../auth/entities/user.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { EmailService } from '../common/services/email.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let fileUploadService: FileUploadService;
  let emailService: EmailService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockFileUploadService = {
    uploadFile: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // Los servicios están disponibles para testing si necesitamos hacer assertions específicas
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        area: UserArea.COMMERCIAL,
      };

      const mockUser = {
        id: '1',
        ...createUserDto,
        password: expect.any(String), // Password generado dinámicamente
        isActive: true,
        fullName: 'John Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deletedAt: expect.anything() }
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };

      const existingUser = { id: '1', email: 'existing@example.com' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: expect.anything() },
        relations: ['company']
      });
      expect(result.id).toBe(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '1';
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user status successfully', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        isActive: true,
        email: 'test@example.com',
      };

      const updatedUser = { ...mockUser, isActive: false };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.toggleStatus(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: expect.anything() }
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should soft delete a user successfully', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        deletedAt: null,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await service.remove(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: expect.anything() }
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '1';
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
