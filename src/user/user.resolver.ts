import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UpdateUserInput } from './dto/update-user.input';
import { RegisterInput } from './dto/register-user.input';
import { UserPayload } from './entities/user-payload.entity';
import { LoginUserInput } from './dto/login-user.input';
import { UseGuards } from '@nestjs/common';
import { GqlJWTGuard } from 'src/common/guards/gql-jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  BiometricLoginInput,
  RegisterBiometricInput,
} from './dto/biometric.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  async register(@Args('input') input: RegisterInput): Promise<User> {
    return await this.userService.register(input.email, input.password);
  }

  @Mutation(() => UserPayload)
  async login(@Args('input') input: LoginUserInput): Promise<UserPayload> {
    return await this.userService.login(input);
  }

  @Mutation(() => UserPayload)
  async biometricLogin(
    @Args('input') input: BiometricLoginInput,
  ): Promise<UserPayload> {
    return await this.userService.biometricLogin(input);
  }

  @UseGuards(GqlJWTGuard)
  @Mutation(() => User)
  async registerBiometric(
    @Args('input') input: RegisterBiometricInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    return await this.userService.registerBiometric(
      user.id,
      input.biometricKey,
    );
  }

  @UseGuards(GqlJWTGuard)
  @Query(() => User, { name: 'user' })
  async me(@CurrentUser() user: User) {
    return this.userService.findOne(user.id);
  }

  @UseGuards(GqlJWTGuard)
  @Mutation(() => User)
  async updateUser(
    @CurrentUser() user: User,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    return await this.userService.update(user.id, updateUserInput);
  }

  @UseGuards(GqlJWTGuard)
  @Mutation(() => User)
  async removeUser(@CurrentUser() user: User) {
    return await this.userService.remove(user.id);
  }
}
