ALTER TABLE "profiles" DROP CONSTRAINT "profiles_owner_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
