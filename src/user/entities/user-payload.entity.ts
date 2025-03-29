import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserPayload {
  @Field(() => ID)
  userId: string;

  @Field()
  email: string;

  @Field()
  accessToken: string;
}
