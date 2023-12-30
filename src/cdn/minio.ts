import { Client } from "minio";

export default new Client({
  endPoint: process.env.MINIO_ENDPOINT || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: (process.env.MINIO_SSL || "").toLowerCase() == "true",
});
