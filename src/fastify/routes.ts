import rIndex from "./api/index.js";
import rOauth from "./api/oauth.js";
import rProfiles from "./api/profiles.js";

const data = {
  "/api": {
    index: rIndex["/api"],
    "/oauth": rOauth,
    "/profiles": rProfiles,
  } as const,
} as const;

export default data;
