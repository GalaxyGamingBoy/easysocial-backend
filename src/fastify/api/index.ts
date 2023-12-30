import { FastifyInstance } from "fastify";

const routes = {
  "/api": {
    response: {
      "200": {
        type: "object",
        required: ["msg"],
        properties: {
          msg: {
            type: "string",
          },
        },
      },
    },
    description: "The index route of easysocial",
  },
} as const;

export default (fastify: FastifyInstance, _: any, done: any) => {
  fastify.get(
    "/",
    {
      schema: routes["/api"],
    },
    async () => {
      return { msg: "Hello, World!" };
    },
  );

  done();
};
