import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export const client = async (): Promise<pg.Client> => {
    const client = new pg.Client({
        connectionString: `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASS}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
    });

    await client.connect();

    return client;
};

export default async () => {
    return drizzle(await client(), { schema });
};
