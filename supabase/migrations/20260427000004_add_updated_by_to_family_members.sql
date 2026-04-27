-- Add columns to track who last updated a family member
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS updated_by_user_id text,
  ADD COLUMN IF NOT EXISTS updated_by_username text;
