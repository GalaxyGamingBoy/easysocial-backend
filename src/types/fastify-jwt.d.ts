import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      oauthProvider: string;
      iss: string;
      sub: string;
      iat: number;
      exp: number;
    };
  }
}
