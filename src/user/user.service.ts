import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { AuthJwtPayload } from 'src/common/types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from './entities/user-payload.entity';
import { BiometricLoginInput } from './dto/biometric.input';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async generateToken(userId: string) {
    const payload: AuthJwtPayload = { sub: { userId } };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  async register(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email, password: hashedPassword },
    });
  }

  async login({ email, password }: LoginUserInput): Promise<UserPayload> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Generate Access Token
    const accessToken = await this.generateToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      accessToken,
    };
  }

  async registerBiometric(userId: string, biometricKey: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { biometricKey },
    });

    if (existingUser) {
      throw new BadRequestException('Biometric key is already registered');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { biometricKey },
    });
  }

  async biometricLogin(input: BiometricLoginInput): Promise<UserPayload> {
    const { biometricKey } = input;

    const user = await this.prisma.user.findUnique({
      where: { biometricKey },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid biometric key');
    }

    const accessToken = await this.generateToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      accessToken,
    };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async update(userId: string, updateUserInput: UpdateUserInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) throw new NotFoundException('User not found');

    if (updateUserInput.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserInput.email },
      });
      if (emailExists && emailExists.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
    }

    if (updateUserInput.password) {
      updateUserInput.password = await bcrypt.hash(
        updateUserInput.password,
        10,
      );
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: updateUserInput,
    });
  }

  async remove(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return await this.prisma.user.delete({ where: { id: userId } });
  }
}
