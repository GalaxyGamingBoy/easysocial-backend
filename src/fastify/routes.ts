import rIndex from "./index.json" assert { type: "json" };

const data = {
    "/api": {
        index: rIndex["/api"],
    },
} as const;

export default data;
