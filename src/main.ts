import fastifyCORS from "@fastify/cors";
import fastifyJWT from "@fastify/jwt";
import fastifySWAGGER from "@fastify/swagger";
import fastifySWAGGERUI from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { FromSchema } from "json-schema-to-ts";

import { providers } from "./accounts/oauth.js";
import {
  createUser,
  doesUserExist,
  genOauth,
  loginGithub,
} from "./accounts/users.js";
import config from "./fastify/config.js";
import routes from "./fastify/routes.js";

// Config
const fastify = Fastify({
  logger: true,
});

// Register Plugins
await fastify.register(fastifyCORS, config.plugins.cors);
await fastify.register(fastifySWAGGER, { swagger: config.plugins.swagger });
await fastify.register(fastifySWAGGERUI, config.plugins["swagger-ui"]);
await fastify.register(fastifyJWT, { secret: process.env.JWT_SECRET || "" });

// Routes
fastify.get(
  "/api",
  {
    schema: routes["/api"].index,
  },
  async () => {
    return { msg: "Hello, World!" };
  },
);

fastify.get(
  "/api/oauth/",
  {
    schema: routes["/api"]["/oauth"]["/"],
  },
  async (
    request: FastifyRequest<{
      Querystring: FromSchema<
        (typeof routes)["/api"]["/oauth"]["/"]["querystring"]
      >;
    }>,
    reply: FastifyReply,
  ) => {
    reply.redirect(
      302,
      genOauth(request.query.provider as providers) || process.env.HOST || "",
    );
  },
);

fastify.get(
  "/api/oauth/github/",
  { schema: routes["/api"]["/oauth"]["/github"] },
  async (
    req: FastifyRequest<{
      Querystring: FromSchema<
        (typeof routes)["/api"]["/oauth"]["/github"]["querystring"]
      >;
    }>,
    rep: FastifyReply,
  ) => {
    const ghUser = await loginGithub(req.query.code, req.query.state);

    if (ghUser) {
      const userExists = await doesUserExist(
        ghUser.email || "",
        ghUser.oauthProvider as providers,
      );

      if (!userExists[0]) {
        const user = await createUser(ghUser);
        return { jwt: fastify.jwt.sign(user) };
      }

      return {
        jwt: fastify.jwt.sign(userExists[1]),
      };
    }

    rep.code(401);
    return {
      state: req.query.state,
      msg: "An error occured with authenticating the user.",
    };
  },
);

// Run
try {
  await fastify.listen({ port: Number(process.env.PORT) || 3000 });
} catch (e) {
  fastify.log.error(`An error occured on fastify startup!\n${e}`);
  process.exit(1);
}
