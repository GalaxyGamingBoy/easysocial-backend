export default {
  "/": {
    description: `
Generates an OAuth URL for the selected provider.
After completion it will redirect to \`https://<URL>/oauth/<PROVIDER>\`
    `,
    tags: ["auth"],
    querystring: {
      type: "object",
      required: ["provider"],
      properties: {
        provider: {
          type: "string",
          enum: ["github", "google", "microsoft"],
        },
      },
    },
  },
  "/github": {
    description: `
Completes the autorization part with github.
Github will redirect here after finishing autorization.
    `,
    tags: ["auth"],
    querystring: {
      type: "object",
      required: ["state", "code"],
      properties: {
        state: { type: "string" },
        code: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          jwt: { type: "string" },
        },
      },
      401: {
        type: "object",
        properties: {
          state: { type: "string" },
          msg: { type: "string" },
        },
      },
    },
  },
} as const;
