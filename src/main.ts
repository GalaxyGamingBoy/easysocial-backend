import fastifyCORS from "@fastify/cors";
import fastifyJWT from "@fastify/jwt";
import fastifySWAGGER from "@fastify/swagger";
import fastifySWAGGERUI from "@fastify/swagger-ui";
import "dotenv/config";
import Fastify, { FastifyInstance } from "fastify";

import rIndex from "./fastify/api/index.js";
import rOauth from "./fastify/api/oauth.js";
import rProfiles from "./fastify/api/profiles.js";
import config from "./fastify/config.js";

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
await fastify.register(
  async (fastify: FastifyInstance, _: any, done: any) => {
    await fastify.register(rIndex);
    await fastify.register(rOauth);
    await fastify.register(rProfiles);
    done();
  },
  { prefix: "/v1" },
);

// Run
try {
  await fastify.listen({ port: Number(process.env.PORT) || 3000 });
} catch (e) {
  fastify.log.error(`An error occured on fastify startup!\n${e}`);
  process.exit(1);
}
