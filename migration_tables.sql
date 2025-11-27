-- Atualização para Sistema de Mesas

-- 1. Tabela de Mesas
create table public.tables (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  number int not null,
  status text default 'free', -- 'free', 'occupied'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.tables enable row level security;
create policy "Users can manage their own tables" on public.tables for all using (auth.uid() = user_id);

-- 2. Atualizar Pedidos para suportar Mesas
alter table public.orders 
add column table_id uuid references public.tables(id) on delete set null,
add column table_number int; -- Guardar histórico do número caso a mesa seja deletada

-- Se o pedido estiver 'open', ele é a conta aberta da mesa
-- Se 'completed', é um histórico fechado

-- 3. Inserir algumas mesas padrão para começar (para o usuário logado)
-- Nota: Isso deve ser rodado após o usuário criar conta, mas podemos deixar o front criar.
