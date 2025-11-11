# Database Migration Instructions

## Problem
The `reward` and `handover_location_private` columns are missing from your `items` table in Supabase.

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase_migration.sql`
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Option 2: Run SQL Directly

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Add reward column (nullable numeric for lost items)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reward NUMERIC(10, 2) NULL;

-- Add handover_location_private column (nullable text for found items - private field)
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS handover_location_private TEXT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN items.handover_location_private IS 'Private handover location for found items. Only visible to the item owner (finder) and approved claimers.';
COMMENT ON COLUMN items.reward IS 'Optional reward amount for lost items.';
```

### Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('reward', 'handover_location_private');
```

You should see both columns listed.

## What These Columns Do

- **reward**: Stores optional reward amounts for lost items (e.g., "$50.00")
- **handover_location_private**: Stores private handover location for found items. This field is:
  - NOT displayed in public item lists
  - Only visible to the item owner (finder) in "My Items"
  - Only shared with approved claimers when they click "I Lost This Item"


