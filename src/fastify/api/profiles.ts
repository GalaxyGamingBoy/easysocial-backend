import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FromSchema } from "json-schema-to-ts";
import {
  createProfile,
  deleteProfile,
  getProfileByUsernameSearch,
  profileExist,
  profileExistsByID,
  profileExistsByUsername,
  updateProfile,
  usernameExists,
} from "../../accounts/profiles.js";
import uuidRegex from "../../regex/uuid.js";
import { jwtAuth } from "../config.js";

const routes = {
  "/POST": {
    description: `
Creates a user profile, it will 409 if a duplicate profile/username is avainable.
See \`conflict\` field.
    `,
    body: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: { status: { type: "boolean", default: true } },
      },
      409: {
        type: "object",
        required: ["conflict", "msg"],
        properties: {
          status: { type: "boolean", default: false },
          conflict: {
            type: "string",
            description: "The property that has a conflict.",
          },
          msg: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
  "/DELETE": {
    description: `
Deletes a user profile, it will 404 if a profile wasn't found.
    `,
    response: {
      200: {
        type: "object",
        properties: { status: { type: "boolean", default: true } },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
  "/PUT": {
    description: `Updates a user profile, it will 404 if a profile wasn't found.
If there is a conflict an HTTP code 409 will be returned. See \`conflict\` field.`,
    body: {
      type: "object",
      properties: {
        username: { type: "string" },
        displayName: { type: "string" },
        bio: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        required: ["id", "username", "displayName", "bio"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          displayName: { type: "string" },
          bio: { type: "string" },
        },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
      409: {
        type: "object",
        required: ["msg", "conflict"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
          conflict: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
  "/me/": {
    description: `Gets the authed profile.`,
    response: {
      200: {
        type: "object",
        required: ["id", "username", "displayName", "bio"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          displayName: { type: "string" },
          bio: { type: "string" },
        },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
  "/id/:id/": {
    description: `Gets a user with the specified id.`,
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        required: ["id", "username", "displayName", "bio"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          displayName: { type: "string" },
          bio: { type: "string" },
        },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
    },
    tags: ["user"],
  },
  "/username/:username/": {
    description: `Gets a user with the specified id.`,
    params: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        required: ["id", "username", "displayName", "bio"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          displayName: { type: "string" },
          bio: { type: "string" },
        },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
    },
    tags: ["user"],
  },
  "/search/": {
    description: `Searches the database for usernames using the query(\`q\`).
Returns up to *12* users.`,
    querystring: {
      type: "object",
      required: ["q"],
      properties: {
        q: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        required: ["results", "resultsCount"],
        properties: {
          resultsCount: { type: "number", default: 0 },
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                username: { type: "string" },
                displayName: { type: "string" },
                bio: { type: "string" },
              },
            },
          },
        },
      },
    },
    tags: ["user"],
  },
} as const;

export default (fastify: FastifyInstance, _: any, done: any) => {
  fastify.post(
    "/profiles/",
    {
      schema: routes["/POST"],
      onRequest: [jwtAuth],
    },
    async (
      req: FastifyRequest<{
        Body: FromSchema<(typeof routes)["/POST"]["body"]>;
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
    "/profiles/",
    {
      schema: routes["/DELETE"],
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
    "/profiles/",
    {
      schema: routes["/PUT"],
      onRequest: [jwtAuth],
    },
    async (
      req: FastifyRequest<{
        Body: FromSchema<(typeof routes)["/PUT"]["body"]>;
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
    "/profiles/me/",
    { schema: routes["/me/"], onRequest: [jwtAuth] },
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
    "/profiles/id/:id/",
    { schema: routes["/id/:id/"] },
    async (
      req: FastifyRequest<{
        Params: FromSchema<(typeof routes)["/id/:id/"]["params"]>;
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

  fastify.get(
    "/profiles/username/:username/",
    { schema: routes["/username/:username/"] },
    async (
      req: FastifyRequest<{
        Params: FromSchema<(typeof routes)["/username/:username/"]["params"]>;
      }>,
      rep: FastifyReply,
    ) => {
      const profile = await profileExistsByUsername(req.params.username);
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
    "/profiles/search/",
    { schema: routes["/search/"] },
    async (
      req: FastifyRequest<{
        Querystring: FromSchema<(typeof routes)["/search/"]["querystring"]>;
      }>,
    ) => {
      const query = await getProfileByUsernameSearch(req.query.q);

      return { resultsCount: query.length, results: query };
    },
  );

  done();
};
