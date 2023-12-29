import { eq } from "drizzle-orm";
import drizzle from "../db/drizzle.js";
import { profiles as profilesTable } from "../db/schema.js";
type Profile = typeof profilesTable.$inferSelect;

const db = await drizzle();

/**
 * Checks if a profile is already associated with a userid
 *
 * @param userID The owner to check
 * @returns a tuple with a boolean and a profile if it was found
 */
export const profileExist = async (
  userID: string,
): Promise<[boolean, Profile]> => {
  const query = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.owner, userID))
    .limit(1);

  return [query.length > 0, query[0]];
};

/**
 * Checks if a profile with that username already exists
 *
 * @param username The username to check
 * @returns  a boolean showing if it exists
 */
export const usernameExists = async (username: string): Promise<boolean> => {
  const query = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, username))
    .limit(1);

  return query.length > 0;
};

/**
 * Creates a profile
 *
 * @param userID The userid that will be the owner of the profile
 * @param username The unique username of the profile
 * @returns The profile
 */
export const createProfile = async (
  userID: string,
  username: string,
): Promise<Profile> => {
  const query = await db
    .insert(profilesTable)
    .values({
      displayName: username,
      username: username,
      owner: userID,
      bio: `A profile for ${username}`,
    })
    .returning();

  return query[0];
};

/**
 * Updates a uesr profile
 * 
 * @param userID The owner id of the profile
 * @param username The new username, must be seperate than the last one
 * @param displayName The new displayname
 * @param bio The new bio
 * @returns The updated profile
 */
export const updateProfile = async (
  userID: string,
  username: string,
  displayName: string,
  bio: string,
): Promise<Profile> => {
  const query = await db
    .update(profilesTable)
    .set({ username: username, displayName: displayName, bio: bio })
    .where(eq(profilesTable.owner, userID))
    .returning();

  return query[0];
};

/**
 * Deletes a profile
 *
 * @param userID The userid of the profile to delete
 */
export const deleteProfile = async (userID: string) => {
  await db.delete(profilesTable).where(eq(profilesTable.owner, userID));
};
