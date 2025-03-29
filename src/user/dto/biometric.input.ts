import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BiometricLoginInput {
  @Field()
  biometricKey: string;
}

@InputType()
export class RegisterBiometricInput {
  @Field()
  biometricKey: string;
}
