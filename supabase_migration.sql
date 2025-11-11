-- Migration: Add reward and handover_location_private columns to items table
-- Run this SQL in your Supabase SQL Editor

-- Add reward column (nullable numeric for lost items)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reward NUMERIC(10, 2) NULL;

-- Add handover_location_private column (nullable text for found items - private field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS handover_location_private TEXT NULL;

-- Add comment to document the privacy requirement
COMMENT ON COLUMN items.handover_location_private IS 'Private handover location for found items. Only visible to the item owner (finder) and approved claimers.';

COMMENT ON COLUMN items.reward IS 'Optional reward amount for lost items.';


