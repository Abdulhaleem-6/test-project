import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { BiometricLoginInput } from './dto/biometric.input';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    biometricKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithBiometric = {
    ...mockUser,
    biometricKey: 'bio-key-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Set up default mocks
    jest.spyOn(jwtService, 'signAsync').mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'new@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockUser,
        email,
        password: hashedPassword,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.register(email, password);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual({
        ...mockUser,
        email,
        password: hashedPassword,
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.register(email, password)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      const loginInput: LoginUserInput = {
        email: 'test@example.com',
        password: 'correct-password',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginInput);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        accessToken: 'mock-token',
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const loginInput: LoginUserInput = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginInput: LoginUserInput = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password,
      );
    });
  });

  describe('findOne', () => {
    it('should find and return a user by ID', async () => {
      const userId = 'user-123';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const userId = 'nonexistent-user';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  // Biometric Authentication Tests
  describe('registerBiometric', () => {
    it('should register a biometric key for a user', async () => {
      const userId = 'user-123';
      const biometricKey = 'bio-key-123';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockUserWithBiometric);

      const result = await service.registerBiometric(userId, biometricKey);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { biometricKey },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { biometricKey },
      });
      expect(result).toEqual(mockUserWithBiometric);
    });

    it('should throw BadRequestException if biometric key is already registered', async () => {
      const userId = 'user-123';
      const biometricKey = 'existing-bio-key';
      const existingUser = { ...mockUser, id: 'different-user', biometricKey };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(existingUser);

      await expect(
        service.registerBiometric(userId, biometricKey),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { biometricKey },
      });
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('biometricLogin', () => {
    it('should authenticate user with valid biometric key', async () => {
      const biometricInput: BiometricLoginInput = {
        biometricKey: 'bio-key-123',
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserWithBiometric);

      const result = await service.biometricLogin(biometricInput);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { biometricKey: biometricInput.biometricKey },
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({
        userId: mockUserWithBiometric.id,
        email: mockUserWithBiometric.email,
        accessToken: 'mock-token',
      });
    });

    it('should throw UnauthorizedException for invalid biometric key', async () => {
      const biometricInput: BiometricLoginInput = {
        biometricKey: 'invalid-bio-key',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.biometricLogin(biometricInput)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { biometricKey: biometricInput.biometricKey },
      });
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload', async () => {
      const userId = 'user-123';
      const expectedPayload = { sub: { userId } };

      await service['generateToken'](userId);

      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload);
    });
  });
});
