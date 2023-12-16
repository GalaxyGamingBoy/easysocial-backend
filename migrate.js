import dotenv from "dotenv"
import pg from "pg"
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres/driver";

dotenv.config()

const client = new pg.Client({
    connectionString: `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASS}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
});

await client.connect();

await migrate(drizzle(client), { migrationsFolder: "./drizzle" })

await client.end()