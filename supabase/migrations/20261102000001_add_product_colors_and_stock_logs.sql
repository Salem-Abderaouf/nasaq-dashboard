-- Migration: 20261102000001_add_product_colors_and_stock_logs.sql
-- Description: Add color_options and stock_logs columns to door_products

ALTER TABLE public.door_products 
ADD COLUMN IF NOT EXISTS color_options TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS stock_logs JSONB DEFAULT '[]'::jsonb;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
