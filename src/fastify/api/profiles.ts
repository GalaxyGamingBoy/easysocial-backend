export default {
  "/POST": {
    description: `
Creates a user profile, it will 409 if a duplicate profile/username is avainable.
See \`conflict\` field.
    `,
    body: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: { status: { type: "boolean", default: true } },
      },
      409: {
        type: "object",
        required: ["conflict", "msg"],
        properties: {
          status: { type: "boolean", default: false },
          conflict: {
            type: "string",
            description: "The property that has a conflict.",
          },
          msg: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
  "/DELETE": {
    description: `
Deletes a user profile, it will 404 if a profile wasn't found.
    `,
    response: {
      200: {
        type: "object",
        properties: { status: { type: "boolean", default: true } },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
  "/PUT": {
    description: `Updates a user profile, it will 404 if a profile wasn't found.
If there is a conflict an HTTP code 409 will be returned. See \`conflict\` field.`,
    body: {
      type: "object",
      properties: {
        username: { type: "string" },
        displayName: { type: "string" },
        bio: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        required: ["id", "username", "displayName", "bio", "owner"],
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          displayName: { type: "string" },
          bio: { type: "string" },
          owner: { type: "string" },
        },
      },
      404: {
        type: "object",
        required: ["msg"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
        },
      },
      409: {
        type: "object",
        required: ["msg", "conflict"],
        properties: {
          status: { type: "boolean", default: false },
          msg: { type: "string" },
          conflict: { type: "string" },
        },
      },
    },
    security: [{ jwt: [] }],
    tags: ["user"],
  },
} as const;
