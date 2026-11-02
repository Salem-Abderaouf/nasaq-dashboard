-- Migration: 20261102000003_add_is_admin_column.sql
-- Description: Add is_admin boolean column to workers and users tables for secure admin role resolution

ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
