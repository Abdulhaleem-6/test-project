import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { LoginUserInput } from './dto/login-user.input';
import { RegisterInput } from './dto/register-user.input';
import {
  BiometricLoginInput,
  RegisterBiometricInput,
} from './dto/biometric.input';

jest.mock(
  'src/common/guards/gql-jwt.guard',
  () => ({
    GqlJWTGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }),
  { virtual: true },
);

jest.mock(
  'src/common/decorators/current-user.decorator',
  () => ({
    CurrentUser: () => jest.fn(),
  }),
  { virtual: true },
);

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password', // this wouldn't be exposed in GraphQL
    biometricKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithBiometric = {
    ...mockUser,
    biometricKey: 'bio-key-123',
  };

  const mockUserPayload = {
    userId: mockUser.id,
    email: mockUser.email,
    accessToken: 'jwt-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            biometricLogin: jest.fn(),
            registerBiometric: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should call userService.register with correct args and return the result', async () => {
      const input: RegisterInput = {
        email: 'new@example.com',
        password: 'password123',
      };

      jest.spyOn(userService, 'register').mockResolvedValue(mockUser);

      const result = await resolver.register(input);

      expect(userService.register).toHaveBeenCalledWith(
        input.email,
        input.password,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should call userService.login with correct input and return the result', async () => {
      const input: LoginUserInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(userService, 'login').mockResolvedValue(mockUserPayload);

      const result = await resolver.login(input);

      expect(userService.login).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockUserPayload);
    });
  });

  describe('biometricLogin', () => {
    it('should call userService.biometricLogin with correct input', async () => {
      const loginInput: BiometricLoginInput = {
        biometricKey: 'bio-key-123',
      };

      jest
        .spyOn(userService, 'biometricLogin')
        .mockResolvedValue(mockUserPayload);

      const result = await resolver.biometricLogin(loginInput);

      expect(userService.biometricLogin).toHaveBeenCalledWith(loginInput);
      expect(result).toEqual(mockUserPayload);
    });

    it('should propagate errors from userService.biometricLogin', async () => {
      const loginInput: BiometricLoginInput = {
        biometricKey: 'invalid-key',
      };

      const error = new Error('Invalid biometric key');
      jest.spyOn(userService, 'biometricLogin').mockRejectedValue(error);

      await expect(resolver.biometricLogin(loginInput)).rejects.toThrow(error);
      expect(userService.biometricLogin).toHaveBeenCalledWith(loginInput);
    });
  });

  describe('registerBiometric', () => {
    it('should call userService.registerBiometric with correct parameters', async () => {
      const input: RegisterBiometricInput = {
        biometricKey: 'new-bio-key-456',
      };

      jest
        .spyOn(userService, 'registerBiometric')
        .mockResolvedValue(mockUserWithBiometric);

      const result = await resolver.registerBiometric(input, mockUser);

      expect(userService.registerBiometric).toHaveBeenCalledWith(
        mockUser.id,
        input.biometricKey,
      );
      expect(result).toEqual(mockUserWithBiometric);
    });

    it('should propagate errors from userService.registerBiometric', async () => {
      const input: RegisterBiometricInput = {
        biometricKey: 'invalid-key',
      };

      const error = new Error('Failed to register biometric key');
      jest.spyOn(userService, 'registerBiometric').mockRejectedValue(error);

      await expect(resolver.registerBiometric(input, mockUser)).rejects.toThrow(
        error,
      );
      expect(userService.registerBiometric).toHaveBeenCalledWith(
        mockUser.id,
        input.biometricKey,
      );
    });
  });

  describe('me', () => {
    it('should call userService.findOne with current user id', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      const result = await resolver.me(mockUser);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should propagate errors from userService.findOne', async () => {
      const error = new Error('User not found');
      jest.spyOn(userService, 'findOne').mockRejectedValue(error);

      await expect(resolver.me(mockUser)).rejects.toThrow(error);
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
