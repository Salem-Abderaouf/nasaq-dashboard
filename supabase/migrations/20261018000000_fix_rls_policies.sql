-- Migration: 20261018000000_fix_rls_policies.sql
-- Description: Enable RLS access for anon and authenticated roles across all NASAQ tables to allow client creation, orders, items, payments, prospects, and workers.

-- 1. clients
DROP POLICY IF EXISTS "Admins have full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone authenticated can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone authenticated can read clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone authenticated can update clients" ON public.clients;
DROP POLICY IF EXISTS "Enable all access for clients" ON public.clients;
CREATE POLICY "Enable all access for clients"
  ON public.clients
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. door_products
DROP POLICY IF EXISTS "Admins have full access to products" ON public.door_products;
DROP POLICY IF EXISTS "Anyone authenticated can read products" ON public.door_products;
DROP POLICY IF EXISTS "Enable all access for door_products" ON public.door_products;
CREATE POLICY "Enable all access for door_products"
  ON public.door_products
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. orders
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone authenticated can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Workers can update their own draft orders" ON public.orders;
DROP POLICY IF EXISTS "Workers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for orders" ON public.orders;
CREATE POLICY "Enable all access for orders"
  ON public.orders
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. order_items
DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Workers can insert items for draft orders they own" ON public.order_items;
DROP POLICY IF EXISTS "Workers can update items for draft orders they own" ON public.order_items;
DROP POLICY IF EXISTS "Workers can view items for their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Enable all access for order_items" ON public.order_items;
CREATE POLICY "Enable all access for order_items"
  ON public.order_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. order_payments
DROP POLICY IF EXISTS "Admins can update payments" ON public.order_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.order_payments;
DROP POLICY IF EXISTS "Anyone authenticated can insert payments" ON public.order_payments;
DROP POLICY IF EXISTS "Workers can view payments for their own orders" ON public.order_payments;
DROP POLICY IF EXISTS "Enable all access for order_payments" ON public.order_payments;
CREATE POLICY "Enable all access for order_payments"
  ON public.order_payments
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. order_status_history
DROP POLICY IF EXISTS "Admins can view all status histories" ON public.order_status_history;
DROP POLICY IF EXISTS "Workers can view status history for their own orders" ON public.order_status_history;
DROP POLICY IF EXISTS "Enable all access for order_status_history" ON public.order_status_history;
CREATE POLICY "Enable all access for order_status_history"
  ON public.order_status_history
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 7. prospects
DROP POLICY IF EXISTS "Admins can delete prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins can update all prospects" ON public.prospects;
DROP POLICY IF EXISTS "Admins can view all prospects" ON public.prospects;
DROP POLICY IF EXISTS "Anyone authenticated can insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Workers can update prospects they created" ON public.prospects;
DROP POLICY IF EXISTS "Workers can view prospects they created" ON public.prospects;
DROP POLICY IF EXISTS "Enable all access for prospects" ON public.prospects;
CREATE POLICY "Enable all access for prospects"
  ON public.prospects
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 8. workers
DROP POLICY IF EXISTS "Admins have full access to workers" ON public.workers;
DROP POLICY IF EXISTS "Enable all access for workers" ON public.workers;
CREATE POLICY "Enable all access for workers"
  ON public.workers
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 9. salary_advances
DROP POLICY IF EXISTS "Admins have full access to salary_advances" ON public.salary_advances;
DROP POLICY IF EXISTS "Enable all access for salary_advances" ON public.salary_advances;
CREATE POLICY "Enable all access for salary_advances"
  ON public.salary_advances
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 10. salary_bonuses
DROP POLICY IF EXISTS "Admins have full access to salary_bonuses" ON public.salary_bonuses;
DROP POLICY IF EXISTS "Enable all access for salary_bonuses" ON public.salary_bonuses;
CREATE POLICY "Enable all access for salary_bonuses"
  ON public.salary_bonuses
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 11. salary_deductions
DROP POLICY IF EXISTS "Admins have full access to salary_deductions" ON public.salary_deductions;
DROP POLICY IF EXISTS "Enable all access for salary_deductions" ON public.salary_deductions;
CREATE POLICY "Enable all access for salary_deductions"
  ON public.salary_deductions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 12. salary_payments
DROP POLICY IF EXISTS "Admins have full access to salary_payments" ON public.salary_payments;
DROP POLICY IF EXISTS "Enable all access for salary_payments" ON public.salary_payments;
CREATE POLICY "Enable all access for salary_payments"
  ON public.salary_payments
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 13. worker_salary_history
DROP POLICY IF EXISTS "Admins have full access to worker_salary_history" ON public.worker_salary_history;
DROP POLICY IF EXISTS "Enable all access for worker_salary_history" ON public.worker_salary_history;
CREATE POLICY "Enable all access for worker_salary_history"
  ON public.worker_salary_history
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 14. users
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Users can read active user profiles" ON public.users;
DROP POLICY IF EXISTS "Enable all access for users" ON public.users;
CREATE POLICY "Enable all access for users"
  ON public.users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
