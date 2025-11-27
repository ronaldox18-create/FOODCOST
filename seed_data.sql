-- Script para popular o banco de dados com dados de teste para o usuário teste@email.com
-- Execute este script no SQL Editor do Supabase

DO $$
DECLARE
    target_user_id uuid;
    ing_picanha uuid;
    ing_batata uuid;
    ing_arroz uuid;
    ing_feijao uuid;
    ing_alface uuid;
    ing_tomate uuid;
    ing_oleo uuid;
    ing_sal uuid;
    ing_cebola uuid;
    ing_alho uuid;
    prod_prato_feito uuid;
    prod_picanha_chapa uuid;
    cust_joao uuid;
    cust_maria uuid;
BEGIN
    -- 1. Obter o ID do usuário (substitua o email se necessário)
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'teste@email.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Usuário teste@email.com não encontrado. Crie a conta primeiro.';
        RETURN;
    END IF;

    -- Limpar dados existentes desse usuário para não duplicar (opcional)
    DELETE FROM public.order_items WHERE user_id = target_user_id;
    DELETE FROM public.orders WHERE user_id = target_user_id;
    DELETE FROM public.product_ingredients WHERE user_id = target_user_id;
    DELETE FROM public.products WHERE user_id = target_user_id;
    DELETE FROM public.ingredients WHERE user_id = target_user_id;
    DELETE FROM public.fixed_costs WHERE user_id = target_user_id;
    DELETE FROM public.customers WHERE user_id = target_user_id;

    -- 2. Inserir Ingredientes
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Picanha', 'kg', 1, 89.90, 85, 10, 5) RETURNING id INTO ing_picanha;
    
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Batata Inglesa', 'kg', 1, 4.50, 80, 50, 10) RETURNING id INTO ing_batata;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Arroz Branco', 'kg', 5, 25.00, 100, 20, 5) RETURNING id INTO ing_arroz;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Feijão Preto', 'kg', 1, 8.00, 100, 15, 2) RETURNING id INTO ing_feijao;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Alface Americana', 'un', 1, 3.50, 90, 12, 3) RETURNING id INTO ing_alface;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Tomate', 'kg', 1, 7.90, 90, 8, 2) RETURNING id INTO ing_tomate;
    
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Óleo de Soja', 'l', 0.9, 6.50, 100, 20, 5) RETURNING id INTO ing_oleo;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Sal Refinado', 'kg', 1, 2.00, 100, 5, 1) RETURNING id INTO ing_sal;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Cebola', 'kg', 1, 3.90, 85, 10, 2) RETURNING id INTO ing_cebola;

    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
    VALUES 
    (target_user_id, 'Alho', 'kg', 1, 18.00, 90, 2, 0.5) RETURNING id INTO ing_alho;

    -- 3. Inserir Custos Fixos
    INSERT INTO public.fixed_costs (user_id, name, amount) VALUES (target_user_id, 'Aluguel', 2500.00);
    INSERT INTO public.fixed_costs (user_id, name, amount) VALUES (target_user_id, 'Energia Elétrica', 600.00);
    INSERT INTO public.fixed_costs (user_id, name, amount) VALUES (target_user_id, 'Internet', 120.00);
    INSERT INTO public.fixed_costs (user_id, name, amount) VALUES (target_user_id, 'Funcionários', 4500.00);

    -- 4. Inserir Produtos (Cardápio)
    
    -- Prato Feito
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method)
    VALUES 
    (target_user_id, 'PF Clássico', 'Pratos Feitos', 'Arroz, feijão, batata frita e salada.', 25.00, '1. Cozinhar arroz e feijão. 2. Fritar batatas. 3. Montar salada.') 
    RETURNING id INTO prod_prato_feito;

    INSERT INTO public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, unit_used) VALUES
    (target_user_id, prod_prato_feito, ing_arroz, 150, 'g'),
    (target_user_id, prod_prato_feito, ing_feijao, 100, 'g'),
    (target_user_id, prod_prato_feito, ing_batata, 150, 'g'), -- Vai precisar fritar, usa oleo tb
    (target_user_id, prod_prato_feito, ing_oleo, 20, 'ml'),
    (target_user_id, prod_prato_feito, ing_alface, 0.2, 'un'),
    (target_user_id, prod_prato_feito, ing_tomate, 50, 'g');

    -- Picanha na Chapa
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method)
    VALUES 
    (target_user_id, 'Picanha na Chapa', 'Churrasco', 'Picanha grelhada com cebola.', 85.00, '1. Cortar picanha. 2. Grelhar. 3. Adicionar cebolas.') 
    RETURNING id INTO prod_picanha_chapa;

    INSERT INTO public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, unit_used) VALUES
    (target_user_id, prod_picanha_chapa, ing_picanha, 400, 'g'),
    (target_user_id, prod_picanha_chapa, ing_cebola, 100, 'g'),
    (target_user_id, prod_picanha_chapa, ing_sal, 5, 'g');

    -- 5. Inserir Clientes
    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date)
    VALUES 
    (target_user_id, 'João Silva', '11999999999', 'joao@cliente.com', 25.00, NOW() - INTERVAL '2 days') RETURNING id INTO cust_joao;

    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date)
    VALUES 
    (target_user_id, 'Maria Oliveira', '11988888888', 'maria@cliente.com', 85.00, NOW() - INTERVAL '1 day') RETURNING id INTO cust_maria;

    -- 6. Inserir Pedidos
    INSERT INTO public.orders (user_id, customer_id, customer_name, total_amount, payment_method, status, date)
    VALUES 
    (target_user_id, cust_joao, 'João Silva', 25.00, 'credit', 'completed', NOW() - INTERVAL '2 days');
    
    INSERT INTO public.order_items (user_id, order_id, product_id, product_name, quantity, unit_price, total)
    VALUES 
    (target_user_id, (SELECT id FROM public.orders WHERE customer_id = cust_joao LIMIT 1), prod_prato_feito, 'PF Clássico', 1, 25.00, 25.00);

    INSERT INTO public.orders (user_id, customer_id, customer_name, total_amount, payment_method, status, date)
    VALUES 
    (target_user_id, cust_maria, 'Maria Oliveira', 85.00, 'pix', 'completed', NOW() - INTERVAL '1 day');
    
    INSERT INTO public.order_items (user_id, order_id, product_id, product_name, quantity, unit_price, total)
    VALUES 
    (target_user_id, (SELECT id FROM public.orders WHERE customer_id = cust_maria LIMIT 1), prod_picanha_chapa, 'Picanha na Chapa', 1, 85.00, 85.00);

    RAISE NOTICE 'Dados de teste inseridos com sucesso para o usuário %', target_user_id;
END $$;
