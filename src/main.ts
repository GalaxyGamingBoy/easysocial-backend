import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyCORS from "@fastify/cors";
import fastifySWAGGER from "@fastify/swagger";
import fastifySWAGGERUI from "@fastify/swagger-ui";
import fastifyJWT from "@fastify/jwt";
import dotenv from "dotenv";

import routes from "./fastify/routes.js";
import config from "./fastify/config.js";

// Config
dotenv.config();
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
    }
);

// Run
try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000 });
} catch (e) {
    fastify.log.error(`An error occured on fastify startup!\n${e}`);
    process.exit(1);
}
