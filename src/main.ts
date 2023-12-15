import Fastify from "fastify";
import dotenv from "dotenv";

dotenv.config();
const fastify = Fastify({
    logger: true,
});

fastify.get(
    "/api",
    {
        schema: {
            response: {
                200: {
                    type: "object",
                    required: ["msg"],
                    properties: { msg: { type: "string" } },
                },
            },
        },
    },
    async () => {
        return { mssg: "Hello, World!" };
    }
);

try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000 });
} catch (e) {
    fastify.log.error(`An error occured on fastify startup!\n${e}`);
    process.exit(1);
}
