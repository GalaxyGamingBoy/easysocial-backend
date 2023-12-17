import { users as userTable } from "../db/schema.js";

type User = typeof userTable.$inferSelect;
export const enum providers {
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

export const getGithubUser = async (token: string): Promise<User> => {
  const req = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer: " + token,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }).then((d) => d.json());

  return { id: req.node_id, email: req.email, oauthProvider: "github" };
};
