-- Migration: 20261021000000_add_order_promo_and_item_config.sql
-- Description: Add is_promo_enabled to orders, and color & configuration to order_items.

-- 1. Add is_promo_enabled to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_promo_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Add color and configuration to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'chene_bois';

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb;

-- 3. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
