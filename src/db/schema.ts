/*
    src/db/schema.ts
    This file contains the schema for the DB

    Notes:
    + As per RFC3696[1], max email length should be considered as 320 characters.

    [1]: https://www.rfc-editor.org/rfc/rfc3696 (Page 5, Section 3)
*/

import {
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const oauthProviderEnum = pgEnum("oauth_provider", [
  "github",
  "google",
  "microsoft",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }),
  oauthProvider: oauthProviderEnum("oauth_provider"),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    owner: uuid("owner")
      .references(() => users.id, { onDelete: "cascade" })
      .unique()
      .notNull(),
    username: varchar("username", { length: 24 }).unique().notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
  },
  (profiles) => {
    return {
      usernameIdx: index("username_idx").on(profiles.username),
      ownerIdx: index("owner_idx").on(profiles.owner),
    };
  },
);
