CREATE TABLE "creative_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_id" text NOT NULL,
	"from_lines" text,
	"subject_lines" text,
	"proofreading_data" jsonb,
	"html_content" text,
	"additional_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creative_metadata_creative_id_unique" UNIQUE("creative_id")
);
--> statement-breakpoint
ALTER TABLE "creative_requests" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "creative_requests" ADD COLUMN "telegram_id" text;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "telegram_id" text;--> statement-breakpoint
CREATE INDEX "idx_creative_metadata_creative_id" ON "creative_metadata" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "idx_creative_metadata_updated_at" ON "creative_metadata" USING btree ("updated_at");