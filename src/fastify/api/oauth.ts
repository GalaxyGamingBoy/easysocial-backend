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
} as const;
