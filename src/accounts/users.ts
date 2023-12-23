import cache from "node-cache";
import { v4 } from "uuid";

import { and, eq } from "drizzle-orm";
import drizzle from "../db/drizzle.js";
import { users as usersTable } from "../db/schema.js";
import {
  genGithubURL,
  getGithubToken,
  getGithubUser,
  providers as oauthProvider,
} from "./oauth.js";
type User = typeof usersTable.$inferSelect;

const db = await drizzle();
const stateCache = new cache({
  stdTTL: Number(process.env.OAUTH_STATE_TTL) || 6000,
  checkperiod: Number(process.env.OAUTH_STATE_CHECK),
});

/**
 * Provides a valid oauth url for the client to redirect.
 *
 * @param provider The service provider
 * @returns The OAuth url to redirect to
 */
export const genOauth = (provider: oauthProvider): string | void => {
  const state = v4();
  const redirect = `https://${process.env.HOST}/api/oauth/${provider}/`;

  stateCache.set(state, provider);
  console.log(redirect);

  if (provider === oauthProvider.GITHUB) {
    return genGithubURL(state, redirect);
  }
};

/**
 * Returns a user object with information provided by github.
 *
 * @param code The code that was returned by github.
 * @param state The state that was returned by github.
 * @returns void if the state wasn't found or a User
 */
export const loginGithub = async (
  code: string,
  state: string,
): Promise<User | void> => {
  if (
    !stateCache.has(state) ||
    stateCache.get(state) !== oauthProvider.GITHUB
  ) {
    return;
  }
  stateCache.del(state);

  return await getGithubUser(await getGithubToken(code));
};

export const doesUserExist = async (
  email: string,
  provider: oauthProvider,
): Promise<[boolean, User]> => {
  const query = await db
    .select()
    .from(usersTable)
    .where(
      and(eq(usersTable.email, email), eq(usersTable.oauthProvider, provider)),
    )
    .limit(1);

  return [query.length > 0, query[0]];
};

export const createUser = async (user: User): Promise<User> => {
  const query = await db
    .insert(usersTable)
    .values({ email: user.email, oauthProvider: user.oauthProvider })
    .returning();

  return query[0];
};
