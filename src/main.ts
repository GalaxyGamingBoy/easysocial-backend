import fastifyCORS from "@fastify/cors";
import fastifyJWT from "@fastify/jwt";
import fastifySWAGGER from "@fastify/swagger";
import fastifySWAGGERUI from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { FromSchema } from "json-schema-to-ts";

import { providers } from "./accounts/oauth.js";
import {
  createProfile,
  deleteProfile,
  profileExist,
  profileExistsByID,
  updateProfile,
  usernameExists,
} from "./accounts/profiles.js";
import {
  createUser,
  doesUserExist,
  genJWTConfig,
  genOauth,
  loginGithub,
  loginGoogle,
  loginMicrosoft,
} from "./accounts/users.js";
import config, { jwtAuth } from "./fastify/config.js";
import routes from "./fastify/routes.js";
import uuidRegex from "./regex/uuid.js";

// Config
const fastify = Fastify({
  logger: true,
});

// Register Plugins
await fastify.register(fastifyCORS, config.plugins.cors);
await fastify.register(fastifySWAGGER, {
  swagger: {
    info: config.plugins.swagger.info,
    host: config.plugins.swagger.host,
    schemes: config.plugins.swagger.schemes,
    consumes: config.plugins.swagger.consumes,
    produces: config.plugins.swagger.produces,
    tags: config.plugins.swagger.tags,
    securityDefinitions: {
      jwt: {
        in: "header",
        name: "JSON Web Token",
        type: "apiKey",
        description: "The JSON Web Token returned by an OAuth provider.",
      },
    },
  },
});
await fastify.register(fastifySWAGGERUI, config.plugins["swagger-ui"]);
await fastify.register(fastifyJWT, { secret: process.env.JWT_SECRET || "" });

// Routes
fastify.get(
  "/api/",
  {
    schema: routes["/api"].index,
  },
  async () => {
    return { msg: "Hello, World!" };
  },
);

// ROUTES - OAuth
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
        return { jwt: fastify.jwt.sign(user, genJWTConfig()) };
      }

      return {
        jwt: fastify.jwt.sign(userExists[1], genJWTConfig()),
      };
    }

    rep.code(401);
    return {
      state: req.query.state,
      msg: "An error occured with authenticating the user.",
    };
  },
);

fastify.get(
  "/api/oauth/google/",
  { schema: routes["/api"]["/oauth"]["/google"] },
  async (
    req: FastifyRequest<{
      Querystring: FromSchema<
        (typeof routes)["/api"]["/oauth"]["/google"]["querystring"]
      >;
    }>,
    rep: FastifyReply,
  ) => {
    const gglUser = await loginGoogle(req.query.code, req.query.state);

    if (gglUser) {
      const userExists = await doesUserExist(
        gglUser.email || "",
        gglUser.oauthProvider as providers,
      );

      if (!userExists[0]) {
        const user = await createUser(gglUser);

        return { jwt: fastify.jwt.sign(user, genJWTConfig()) };
      }

      return {
        jwt: fastify.jwt.sign(userExists[1], genJWTConfig()),
      };
    }

    rep.code(401);
    return {
      state: req.query.state,
      msg: "An error occured with authenticating the user.",
    };
  },
);

fastify.get(
  "/api/oauth/microsoft/",
  { schema: routes["/api"]["/oauth"]["/microsoft"] },
  async (
    req: FastifyRequest<{
      Querystring: FromSchema<
        (typeof routes)["/api"]["/oauth"]["/microsoft"]["querystring"]
      >;
    }>,
    rep: FastifyReply,
  ) => {
    const msUser = await loginMicrosoft(req.query.code, req.query.state);

    if (msUser) {
      const userExists = await doesUserExist(
        msUser.email || "",
        msUser.oauthProvider as providers,
      );

      if (!userExists[0]) {
        const user = await createUser(msUser);
        return { jwt: fastify.jwt.sign(user, genJWTConfig()) };
      }

      return {
        jwt: fastify.jwt.sign(userExists[1], genJWTConfig()),
      };
    }

    rep.code(401);
    return {
      state: req.query.state,
      msg: "An error occured with authenticating the user.",
    };
  },
);

// ROUTES - Profiles
fastify.post(
  "/api/profiles/",
  {
    schema: routes["/api"]["/profiles"]["/POST"],
    onRequest: [jwtAuth],
  },
  async (
    req: FastifyRequest<{
      Body: FromSchema<(typeof routes)["/api"]["/profiles"]["/POST"]["body"]>;
    }>,
    rep: FastifyReply,
  ) => {
    if ((await profileExist(req.user.id))[0]) {
      rep.code(409);
      return {
        status: false,
        conflict: "profile",
        msg: "Another profile was found with the same user owner id",
      };
    }

    if (await usernameExists(req.body.username)) {
      rep.code(409);
      return {
        status: false,
        conflict: "profile",
        msg: "Another profile was found with the same username",
      };
    }

    createProfile(req.user.id, req.body.username);
    return { status: true };
  },
);

fastify.delete(
  "/api/profiles/",
  {
    schema: routes["/api"]["/profiles"]["/DELETE"],
    onRequest: [jwtAuth],
  },
  async (req: FastifyRequest, rep: FastifyReply) => {
    if (!(await profileExist(req.user.id))[0]) {
      rep.code(404);
      return {
        status: false,
        msg: "A profile wasn't found under the user owner id",
      };
    }

    deleteProfile(req.user.id);
    return { status: true };
  },
);

fastify.put(
  "/api/profiles/",
  {
    schema: routes["/api"]["/profiles"]["/PUT"],
    onRequest: [jwtAuth],
  },
  async (
    req: FastifyRequest<{
      Body: FromSchema<(typeof routes)["/api"]["/profiles"]["/PUT"]["body"]>;
    }>,
    rep: FastifyReply,
  ) => {
    const profile = await profileExist(req.user.id);
    if (!profile[0]) {
      rep.code(404);
      return {
        status: false,
        conflict: "profile",
        msg: "A profile with the same user owner id was not found.",
      };
    }

    if (req.body.username && (await usernameExists(req.body.username))) {
      rep.code(409);
      return {
        status: false,
        conflict: "profile",
        msg: "Another profile was found with the same username",
      };
    }

    return updateProfile(
      req.user.id,
      req.body.username || profile[1].username,
      req.body.displayName || profile[1].displayName,
      req.body.bio ||
        profile[1].bio ||
        `A profile for ${req.body.username || profile[1].username}`,
    );
  },
);

fastify.get(
  "/api/profiles/me/",
  { schema: routes["/api"]["/profiles"]["/me/"], onRequest: [jwtAuth] },
  async (req: FastifyRequest, rep: FastifyReply) => {
    const profile = await profileExist(req.user.id);

    if (!profile[0]) {
      rep.code(404);
      return {
        status: false,
        conflict: "profile",
        msg: "A profile with the same user owner id was not found.",
      };
    }

    return profile[1];
  },
);

fastify.get(
  "/api/profiles/id/:id/",
  { schema: routes["/api"]["/profiles"]["/id/:id/"] },
  async (
    req: FastifyRequest<{
      Params: FromSchema<
        (typeof routes)["/api"]["/profiles"]["/id/:id/"]["params"]
      >;
    }>,
    rep: FastifyReply,
  ) => {
    if (!uuidRegex.test(req.params.id)) {
      rep.code(404);
      return {
        status: false,
        msg: "The param id is not a UUID",
      };
    }

    const profile = await profileExistsByID(req.params.id);
    if (!profile[0]) {
      rep.code(404);
      return {
        status: false,
        conflict: "profile",
        msg: "A profile with the same user owner id was not found.",
      };
    }

    return profile[1];
  },
);

// Run
try {
  await fastify.listen({ port: Number(process.env.PORT) || 3000 });
} catch (e) {
  fastify.log.error(`An error occured on fastify startup!\n${e}`);
  process.exit(1);
}
