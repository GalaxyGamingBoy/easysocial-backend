DO $$ BEGIN
 CREATE TYPE "oauth_provider" AS ENUM('github', 'google', 'microsoft');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" uuid NOT NULL,
	"username" varchar(24) NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	CONSTRAINT "profiles_owner_unique" UNIQUE("owner"),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320),
	"oauth_provider" "oauth_provider"
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "username_idx" ON "profiles" ("username");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
