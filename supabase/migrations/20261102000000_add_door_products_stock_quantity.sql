-- Migration: 20261102000000_add_door_products_stock_quantity.sql
-- Description: Add stock_quantity column to door_products and auto-sync stock on order_items / orders status changes.

-- 1. Add stock_quantity column to door_products
ALTER TABLE public.door_products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

-- 2. Create function and triggers to sync stock on order items changes
CREATE OR REPLACE FUNCTION public.sync_door_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT status INTO v_order_status FROM public.orders WHERE id = NEW.order_id;
    IF (v_order_status IS DISTINCT FROM 'cancelled') THEN
      UPDATE public.door_products
      SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
      WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT status INTO v_order_status FROM public.orders WHERE id = OLD.order_id;
    IF (v_order_status IS DISTINCT FROM 'cancelled') THEN
      UPDATE public.door_products
      SET stock_quantity = stock_quantity + OLD.quantity
      WHERE id = OLD.product_id;
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    SELECT status INTO v_order_status FROM public.orders WHERE id = NEW.order_id;
    IF (v_order_status IS DISTINCT FROM 'cancelled') THEN
      IF (OLD.product_id = NEW.product_id) THEN
        UPDATE public.door_products
        SET stock_quantity = GREATEST(0, stock_quantity - (NEW.quantity - OLD.quantity))
        WHERE id = NEW.product_id;
      ELSE
        UPDATE public.door_products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
        UPDATE public.door_products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
        WHERE id = NEW.product_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_door_product_stock_on_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
    UPDATE public.door_products dp
    SET stock_quantity = dp.stock_quantity + sub.total_qty
    FROM (
      SELECT product_id, SUM(quantity) as total_qty
      FROM public.order_items
      WHERE order_id = NEW.id
      GROUP BY product_id
    ) sub
    WHERE dp.id = sub.product_id;
  ELSIF (OLD.status = 'cancelled' AND NEW.status != 'cancelled') THEN
    UPDATE public.door_products dp
    SET stock_quantity = GREATEST(0, dp.stock_quantity - sub.total_qty)
    FROM (
      SELECT product_id, SUM(quantity) as total_qty
      FROM public.order_items
      WHERE order_id = NEW.id
      GROUP BY product_id
    ) sub
    WHERE dp.id = sub.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_door_product_stock ON public.order_items;
CREATE TRIGGER trg_sync_door_product_stock
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.sync_door_product_stock();

DROP TRIGGER IF EXISTS trg_sync_door_product_stock_status ON public.orders;
CREATE TRIGGER trg_sync_door_product_stock_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_door_product_stock_on_order_status();

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
