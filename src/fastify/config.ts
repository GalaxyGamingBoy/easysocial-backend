import { FastifyRequest } from "fastify";
import { SwaggerTheme } from "swagger-themes";
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

data.plugins["swagger-ui"].theme.css[0].content = new SwaggerTheme(
  "v3",
).getBuffer("dark");

export const jwtAuth = async (request: FastifyRequest<any>, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
};

export default data;
