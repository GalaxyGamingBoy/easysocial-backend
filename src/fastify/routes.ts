import rIndex from "./api/index.js";
import rOauth from "./api/oauth.js";

const data = {
  "/api": {
    index: rIndex["/api"],
    "/oauth": rOauth,
  } as const,
} as const;

export default data;
