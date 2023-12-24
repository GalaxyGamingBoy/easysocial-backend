import cache from "node-cache";
import { v4 } from "uuid";

import { and, eq } from "drizzle-orm";
import drizzle from "../db/drizzle.js";
import { users as usersTable } from "../db/schema.js";
import {
  genGithubURL,
  genGoogleURL,
  genMicrosoftURL,
  getGithubToken,
  getGithubUser,
  getGoogleToken,
  getGoogleUser,
  getMicrosoftToken,
  getMicrosoftUser,
  providers,
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
export const genOauth = (provider: providers): string | void => {
  const state = v4();
  const redirect = `https://${process.env.HOST}/api/oauth/${provider}/`;

  stateCache.set(state, provider);
  console.log(redirect);

  if (provider === providers.GITHUB) {
    return genGithubURL(state, redirect);
  } else if (provider === providers.GOOGLE) {
    return genGoogleURL(state, redirect);
  } else if (provider === providers.MICROSOFT) {
    return genMicrosoftURL(state, redirect);
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
  if (!stateCache.has(state) || stateCache.get(state) !== providers.GITHUB) {
    return;
  }
  stateCache.del(state);

  return await getGithubUser(await getGithubToken(code));
};

/**
 * Returns a user object with information provided by google.
 *
 * @param code The code that was returned by google.
 * @param state The state that was returned by google.
 * @returns void if the state wasn't found or a User
 */
export const loginGoogle = async (
  code: string,
  state: string,
): Promise<User | void> => {
  if (!stateCache.has(state) || stateCache.get(state) !== providers.GOOGLE) {
    return;
  }
  stateCache.del(state);

  const redirect = `https://${process.env.HOST}/api/oauth/google/`;
  return await getGoogleUser(await getGoogleToken(code, redirect));
};

/**
 * Returns a user object with information provided by microsoft.
 *
 * @param code The code that was returned by microsoft.
 * @param state The state that was returned by microsoft.
 * @returns void if the state wasn't found or a User
 */
export const loginMicrosoft = async (
  code: string,
  state: string,
): Promise<User | void> => {
  if (!stateCache.has(state) || stateCache.get(state) !== providers.MICROSOFT) {
    return;
  }
  stateCache.del(state);

  const redirect = `https://${process.env.HOST}/api/oauth/microsoft/`;
  return await getMicrosoftUser(await getMicrosoftToken(code, redirect));
};

/**
 * Checks if the user exists.
 *
 * @param email The user email
 * @param provider The provider of the user
 * @returns An array with 2 elements. The first is if the user is found, and the second the user
 */
export const doesUserExist = async (
  email: string,
  provider: providers,
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

/**
 * Creates a user in the DB
 *
 * @param user The user to create
 * @returns The user that was created
 */
export const createUser = async (user: User): Promise<User> => {
  const query = await db
    .insert(usersTable)
    .values({ email: user.email, oauthProvider: user.oauthProvider })
    .returning();

  return query[0];
};

export const genJWTConfig = (): {
  iss: string;
  sub: string;
  expiresIn: number;
} => {
  return {
    iss: process.env.JWT_ISSUER || "EasySocial Issuing Service",
    sub: process.env.JWT_SUBJECT || "EasySocial Authentication Provider",
    expiresIn: Number(process.env.JWT_EXPIREIN) || 7890000,
  };
};
