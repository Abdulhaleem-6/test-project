export type AuthJwtPayload = {
  sub: { userId: string };
  email?: string;
  role?: string;
};
