import { RegisterInput } from './register-user.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput extends PartialType(RegisterInput) {
  @Field(() => ID, { nullable: true })
  id?: string;
}
