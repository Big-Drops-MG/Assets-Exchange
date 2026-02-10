-- Migration: Create impressions and clicks tables, then add batch_id support
-- This migration creates the analytics tables (if they don't exist) and adds batch tracking.
-- These tables are the source of truth for batch performance analytics.
-- 
-- Data Flow:
-- 1. When an asset belongs to a batch (via batch_assets table), impressions/clicks for that asset
--    should automatically include the batch_id
-- 2. This enables querying analytics by batch: "How many impressions did Batch X generate?"
-- 3. batch_id is nullable to maintain backward compatibility with existing data and assets not in batches
-- 4. Foreign key ensures data integrity: only valid batch IDs can be inserted
-- 5. Indexes optimize batch-level analytics queries

-- Create impressions table if it doesn't exist
-- Source of truth for impression tracking and batch analytics
CREATE TABLE IF NOT EXISTS "impressions" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"batch_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create clicks table if it doesn't exist
-- Source of truth for click tracking and batch analytics
CREATE TABLE IF NOT EXISTS "clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"batch_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Foreign Key: impressions.asset_id → assets_table.id
-- Purpose: Ensures asset_id references a valid asset
-- Behavior: ON DELETE CASCADE - Deleting an asset removes all its impressions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'impressions_asset_id_assets_table_id_fk'
  ) THEN
    ALTER TABLE "impressions" ADD CONSTRAINT "impressions_asset_id_assets_table_id_fk" 
      FOREIGN KEY ("asset_id") REFERENCES "public"."assets_table"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Foreign Key: clicks.asset_id → assets_table.id
-- Purpose: Ensures asset_id references a valid asset
-- Behavior: ON DELETE CASCADE - Deleting an asset removes all its clicks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clicks_asset_id_assets_table_id_fk'
  ) THEN
    ALTER TABLE "clicks" ADD CONSTRAINT "clicks_asset_id_assets_table_id_fk" 
      FOREIGN KEY ("asset_id") REFERENCES "public"."assets_table"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Index: idx_impressions_asset_id
-- Purpose: Optimize queries filtering by asset_id
CREATE INDEX IF NOT EXISTS "idx_impressions_asset_id" ON "impressions" USING btree ("asset_id");
--> statement-breakpoint

-- Index: idx_impressions_created_at
-- Purpose: Optimize time-based queries
CREATE INDEX IF NOT EXISTS "idx_impressions_created_at" ON "impressions" USING btree ("created_at");
--> statement-breakpoint

-- Index: idx_clicks_asset_id
-- Purpose: Optimize queries filtering by asset_id
CREATE INDEX IF NOT EXISTS "idx_clicks_asset_id" ON "clicks" USING btree ("asset_id");
--> statement-breakpoint

-- Index: idx_clicks_created_at
-- Purpose: Optimize time-based queries
CREATE INDEX IF NOT EXISTS "idx_clicks_created_at" ON "clicks" USING btree ("created_at");
--> statement-breakpoint

-- Add batch_id column to impressions table (if not already exists)
-- Purpose: Track which batch an impression belongs to (if the asset is part of a batch)
-- Nullable: Yes - maintains backward compatibility with existing impressions and assets not in batches
-- Foreign Key: References batches(id) with ON DELETE SET NULL (if batch is deleted, set to NULL)
ALTER TABLE "impressions" ADD COLUMN IF NOT EXISTS "batch_id" text;
--> statement-breakpoint

-- Add batch_id column to clicks table (if not already exists)
-- Purpose: Track which batch a click belongs to (if the asset is part of a batch)
-- Nullable: Yes - maintains backward compatibility with existing clicks and assets not in batches
-- Foreign Key: References batches(id) with ON DELETE SET NULL (if batch is deleted, set to NULL)
ALTER TABLE "clicks" ADD COLUMN IF NOT EXISTS "batch_id" text;
--> statement-breakpoint

-- Foreign Key: impressions.batch_id → batches.id
-- Purpose: Ensures batch_id references a valid batch
-- Behavior: ON DELETE SET NULL - If a batch is deleted, impressions retain their data but batch_id becomes NULL
--           This preserves historical analytics data even if batches are removed
-- Safety: Prevents insertion of invalid batch_ids (database-level validation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'impressions_batch_id_batches_id_fk'
  ) THEN
    ALTER TABLE "impressions" ADD CONSTRAINT "impressions_batch_id_batches_id_fk" 
      FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Foreign Key: clicks.batch_id → batches.id
-- Purpose: Ensures batch_id references a valid batch
-- Behavior: ON DELETE SET NULL - If a batch is deleted, clicks retain their data but batch_id becomes NULL
--           This preserves historical analytics data even if batches are removed
-- Safety: Prevents insertion of invalid batch_ids (database-level validation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clicks_batch_id_batches_id_fk'
  ) THEN
    ALTER TABLE "clicks" ADD CONSTRAINT "clicks_batch_id_batches_id_fk" 
      FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

-- Index: idx_impressions_batch_id
-- Purpose: Optimize queries filtering by batch_id (e.g., "get all impressions for batch X")
-- Use Case: Batch performance analytics, batch-level reporting
-- Table: impressions
-- Column: batch_id
CREATE INDEX IF NOT EXISTS "idx_impressions_batch_id" ON "impressions" USING btree ("batch_id");
--> statement-breakpoint

-- Index: idx_clicks_batch_id
-- Purpose: Optimize queries filtering by batch_id (e.g., "get all clicks for batch X")
-- Use Case: Batch performance analytics, batch-level reporting, CTR calculations per batch
-- Table: clicks
-- Column: batch_id
CREATE INDEX IF NOT EXISTS "idx_clicks_batch_id" ON "clicks" USING btree ("batch_id");
