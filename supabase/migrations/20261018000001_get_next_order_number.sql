-- Migration: 20261018000001_get_next_order_number.sql
-- Description: Function to fetch the next order / invoice sequence number from Supabase

CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  seq_rec record;
  next_val bigint;
begin
  select last_value, is_called into seq_rec from public.order_number_seq;
  if seq_rec.is_called then
    next_val := seq_rec.last_value + 1;
  else
    next_val := seq_rec.last_value;
  end if;
  return 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 5, '0');
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_order_number() TO anon, authenticated;
