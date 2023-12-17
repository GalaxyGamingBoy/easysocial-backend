import { FastifyReply, FastifyRequest } from "fastify";
import nodePackage from "../../package.json" assert { type: "json" };
import plugins from "./plugins.json" assert { type: "json" };

const data = {
  plugins: plugins,
};

if (process.env.URL) {
  data.plugins.swagger.host = process.env.HOST || "";
}

if (nodePackage.version) {
  data.plugins.swagger.info.version = nodePackage.version;
}

export const jwtAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
};

export default data;
