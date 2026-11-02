-- Migration: 20261102000002_make_order_items_product_id_nullable.sql
-- Description: Ensure order_items.product_id is nullable with ON DELETE SET NULL
-- so that catalog product management never threatens existing registered customer orders.

-- 1. Allow product_id in order_items to be NULL (for custom Studio doors)
ALTER TABLE public.order_items 
ALTER COLUMN product_id DROP NOT NULL;

-- 2. Update foreign key constraint to ON DELETE SET NULL instead of RESTRICT
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.door_products(id) 
ON DELETE SET NULL;

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
