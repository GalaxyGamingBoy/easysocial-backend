export default {
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
