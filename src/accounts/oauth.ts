import { users as userTable } from "../db/schema.js";

type User = typeof userTable.$inferSelect;
export enum providers {
  GITHUB = "github",
  GOOGLE = "google",
  MICROSOFT = "microsoft",
}

/**
 * Generates the github URL to redirect to
 *
 * @param state The state to provide github with
 * @param redirect The redirect uri back to this app
 * @returns The redirect url
 */
export const genGithubURL = (state: string, redirect: string): string => {
  return `https://github.com/login/oauth/authorize?client_id=${process.env.OAUTH_GITHUB_ID}&redirect_uri=${redirect}&state=${state}&allow_signups=true&scope="read:user,user:email"`;
};

/**
 * Generates the google URL to redirect to
 *
 * @param state The state to provide google with
 * @param redirect The redirect uri back to this app
 * @returns The redirect url
 */
export const genGoogleURL = (state: string, redirect: string): string => {
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.OAUTH_GOOGLE_ID}&redirect_uri=${redirect}&state=${state}&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`;
};

/**
 * Generates the microsoft URL to redirect to
 *
 * @param state The state to provide microsoft with
 * @param redirect The redirect uri back to this app
 * @returns The redirect url
 */
export const genMicrosoftURL = (state: string, redirect: string): string => {
  return `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${process.env.OAUTH_MICROSOFT_ID}&redirect_uri=${redirect}&state=${state}&response_type=code&response_mode=query&scope=User.Read`;
};

/**
 * Gets a github access token from the temp code
 *
 * @param code The code provided by github
 * @returns The access token
 */
export const getGithubToken = async (code: string): Promise<string> => {
  const req = await fetch(
    `https://github.com/login/oauth/access_token?code=${code}&client_id=${process.env.OAUTH_GITHUB_ID}&client_secret=${process.env.OAUTH_GITHUB_SECRET}`,
    {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    },
  ).then((d) => d.json());

  return req["access_token"];
};

/**
 * Gets the github user for the selected access token.
 *
 * @param token The github access token
 * @returns The user
 */
export const getGithubUser = async (token: string): Promise<User> => {
  const req = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }).then((d) => d.json());

  return { id: req.node_id, email: req.email, oauthProvider: "github" };
};

/**
 * Gets a google access token from the temp code
 *
 * @param code The code provided by google
 * @param redirect The redirect URL to provide google with
 * @returns The access token
 */
export const getGoogleToken = async (
  code: string,
  redirect: string,
): Promise<string> => {
  const req = await fetch(`https://oauth2.googleapis.com/token`, {
    method: "POST",
    mode: "cors",
    headers: {
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_secret: process.env.OAUTH_GOOGLE_SECRET,
      client_id: process.env.OAUTH_GOOGLE_ID,
      code: code,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  }).then((d) => d.json());

  console.log(req);

  return req.access_token;
};

/**
 * Gets the google user for the selected access token.
 *
 * @param token The google access token
 * @returns The user
 */
export const getGoogleUser = async (token: string): Promise<User> => {
  const req = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
  ).then((d) => d.json());

  return { id: req.sub, email: req.email, oauthProvider: providers.GOOGLE };
};

/**
 * Gets a microsoft access token from the temp code
 *
 * @param code The code provided by microsoft
 * @param redirect The redirect URL to provide google with
 * @returns The access token
 */
export const getMicrosoftToken = async (
  code: string,
  redirect: string,
): Promise<string> => {
  const req = await fetch(
    "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirect}&client_id=${process.env.OAUTH_MICROSOFT_ID}&client_secret=${process.env.OAUTH_MICROSOFT_SECRET}&scope=User.Read`,
    },
  ).then((d) => d.json());

  return req.access_token;
};

/**
 * Gets the microsoft user for the selected access token.
 *
 * @param token The microsoft access token
 * @returns The user
 */
export const getMicrosoftUser = async (token: string): Promise<User> => {
  const req = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Accept: "application/json", Authorization: "Bearer " + token },
  }).then((d) => d.json());

  return { id: req.id, email: req.mail, oauthProvider: providers.MICROSOFT };
};
