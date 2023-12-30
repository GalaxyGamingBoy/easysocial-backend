import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FromSchema } from "json-schema-to-ts";
import { providers } from "../../accounts/oauth.js";
import {
  createUser,
  doesUserExist,
  genJWTConfig,
  genOauth,
  loginGithub,
  loginGoogle,
  loginMicrosoft,
} from "../../accounts/users.js";

const routes = {
  "/": {
    description: `
Generates an OAuth URL for the selected provider.
After completion it will redirect to \`https://<URL>/oauth/<PROVIDER>\`
    `,
    tags: ["auth"],
    querystring: {
      type: "object",
      required: ["provider"],
      properties: {
        provider: {
          type: "string",
          enum: Object.values(providers),
        },
      },
    },
  },
  "/github": {
    description: `
Completes the autorization part with github.
Github will redirect here after finishing autorization.
    `,
    tags: ["auth"],
    querystring: {
      type: "object",
      required: ["state", "code"],
      properties: {
        state: { type: "string" },
        code: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          jwt: { type: "string" },
        },
      },
      401: {
        type: "object",
        properties: {
          state: { type: "string" },
          msg: { type: "string" },
        },
      },
    },
  },
  "/google": {
    description: `
Completes the autorization part with google.
Google will redirect here after finishing autorization.
    `,
    tags: ["auth"],
    querystring: {
      type: "object",
      required: ["state", "code", "scope", "authuser", "prompt"],
      properties: {
        state: { type: "string" },
        code: { type: "string" },
        scope: { type: "string" },
        authuser: { type: "number" },
        prompt: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          jwt: { type: "string" },
        },
      },
      401: {
        type: "object",
        properties: {
          state: { type: "string" },
          msg: { type: "string" },
        },
      },
    },
  },
  "/microsoft": {
    description: `
Completes the autorization part with github.
Github will redirect here after finishing autorization.
    `,
    tags: ["auth"],
    querystring: {
      type: "object",
      required: ["state", "code"],
      properties: {
        state: { type: "string" },
        code: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          jwt: { type: "string" },
        },
      },
      401: {
        type: "object",
        properties: {
          state: { type: "string" },
          msg: { type: "string" },
        },
      },
    },
  },
} as const;

export default (fastify: FastifyInstance, _: any, done: any) => {
  fastify.get(
    "/oauth/",
    {
      schema: routes["/"],
    },
    async (
      request: FastifyRequest<{
        Querystring: FromSchema<(typeof routes)["/"]["querystring"]>;
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
    "/oauth/github/",
    { schema: routes["/github"] },
    async (
      req: FastifyRequest<{
        Querystring: FromSchema<(typeof routes)["/github"]["querystring"]>;
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
    "/oauth/google/",
    { schema: routes["/google"] },
    async (
      req: FastifyRequest<{
        Querystring: FromSchema<(typeof routes)["/google"]["querystring"]>;
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
    "/oauth/microsoft/",
    { schema: routes["/microsoft"] },
    async (
      req: FastifyRequest<{
        Querystring: FromSchema<(typeof routes)["/microsoft"]["querystring"]>;
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

  done();
};
