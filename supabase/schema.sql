-- Marketday application schema
-- Run this once in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Vegetables', 'Fruits', 'Meat', 'Seafood', 'Pantry')),
  unit text not null,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= price),
  image_url text,
  badge text,
  stock integer not null default 0 check (stock >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  postal_code text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('MK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null references auth.users(id) on delete restrict,
  address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'packing', 'ready', 'on_the_way', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  payment_method text check (payment_method in ('paymongo', 'cash_on_delivery')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  delivery_slot text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index if not exists products_category_available_idx on public.products(category, is_available);
create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can view available products" on public.products;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users manage own addresses" on public.addresses;
drop policy if exists "Users view own orders" on public.orders;
drop policy if exists "Users create own orders" on public.orders;
drop policy if exists "Admins update orders" on public.orders;
drop policy if exists "Users view own order items" on public.order_items;
drop policy if exists "Users add items to own orders" on public.order_items;

create policy "Public can view available products"
  on public.products for select
  using (is_available = true or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

create policy "Admins manage products"
  on public.products for all
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

create policy "Users view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own addresses"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view own orders"
  on public.orders for select
  using (auth.uid() = user_id or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

create policy "Users create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins update orders"
  on public.orders for update
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

create policy "Users view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
  );

create policy "Users add items to own orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
