-- ATENÇÃO: ESTE SCRIPT APAGA TODOS OS DADOS EXISTENTES NAS TABELAS DO APLICATIVO
-- Use apenas se estiver configurando o ambiente ou quiser resetar o banco de dados.

-- Limpeza de tabelas antigas (ordem reversa para respeitar chaves estrangeiras)
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.product_ingredients cascade;
drop table if exists public.products cascade;
drop table if exists public.fixed_costs cascade;
drop table if exists public.ingredients cascade;
drop table if exists public.customers cascade;
drop table if exists public.user_settings cascade;

-- Habilita a extensão UUID se ainda não estiver habilitada
create extension if not exists "uuid-ossp";

-- 1. Tabela de Configurações do Usuário (Settings)
create table public.user_settings (
  user_id uuid references auth.users not null primary key,
  business_name text,
  target_margin numeric default 20,
  tax_and_loss_percent numeric default 12,
  estimated_monthly_billing numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.user_settings enable row level security;
create policy "Users can manage their own settings" on public.user_settings for all using (auth.uid() = user_id);

-- 2. Tabela de Ingredientes
create table public.ingredients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  purchase_unit text not null, -- 'kg', 'un', etc
  purchase_quantity numeric not null,
  purchase_price numeric not null,
  yield_percent numeric default 100,
  current_stock numeric default 0,
  min_stock numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.ingredients enable row level security;
create policy "Users can manage their own ingredients" on public.ingredients for all using (auth.uid() = user_id);

-- 3. Tabela de Custos Fixos
create table public.fixed_costs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.fixed_costs enable row level security;
create policy "Users can manage their own fixed costs" on public.fixed_costs for all using (auth.uid() = user_id);

-- 4. Tabela de Produtos (Pratos)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  category text,
  description text,
  current_price numeric default 0,
  preparation_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.products enable row level security;
create policy "Users can manage their own products" on public.products for all using (auth.uid() = user_id);

-- 5. Tabela de Receitas (Ligação Produto <-> Ingrediente)
create table public.product_ingredients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references public.products(id) on delete cascade not null,
  ingredient_id uuid references public.ingredients(id) not null,
  quantity_used numeric not null,
  unit_used text not null
);
alter table public.product_ingredients enable row level security;
create policy "Users can manage their own recipes" on public.product_ingredients for all using (auth.uid() = user_id);

-- 6. Tabela de Clientes
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  total_spent numeric default 0,
  last_order_date timestamp with time zone,
  birth_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.customers enable row level security;
create policy "Users can manage their own customers" on public.customers for all using (auth.uid() = user_id);

-- 7. Tabela de Pedidos
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  customer_id uuid references public.customers(id) on delete set null, -- Se cliente for deletado, mantemos o histórico com null ou customer 'guest' logic
  customer_name text, -- Nome histórico caso o cliente seja deletado ou seja guest
  total_amount numeric not null,
  payment_method text,
  status text default 'pending', -- pending, completed, canceled
  date timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.orders enable row level security;
create policy "Users can manage their own orders" on public.orders for all using (auth.uid() = user_id);

-- 8. Itens do Pedido
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, -- Nome histórico
  quantity numeric not null,
  unit_price numeric not null,
  total numeric not null
);
alter table public.order_items enable row level security;
create policy "Users can manage their own order items" on public.order_items for all using (auth.uid() = user_id);
