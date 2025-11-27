-- Script de População Massiva para Teste de Stress e UX
-- Usuário Alvo: teste@email.com

DO $$
DECLARE
    target_user_id uuid;
    
    -- Ingredientes IDs
    i_pao uuid; i_carne uuid; i_queijo uuid; i_bacon uuid; i_alface uuid; i_tomate uuid; i_cebola uuid; i_picles uuid; i_maionese uuid;
    i_batata uuid; i_oleo uuid; i_sal uuid; i_refri uuid; i_cerveja uuid; i_agua uuid; i_frango uuid; i_farinha uuid; i_ovo uuid;
    
    -- Produtos IDs
    p_smash uuid; p_xburguer uuid; p_xbacon uuid; p_duplo uuid; p_fritas uuid; p_coca uuid; p_agua uuid; p_combo1 uuid;
    
    -- Clientes IDs
    c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;

    -- Variáveis de Loop
    start_date date := NOW() - INTERVAL '6 months';
    current_sale_date date;
    new_order_id uuid; -- Renomeado para evitar ambiguidade
    daily_orders int;
    k int;
BEGIN
    -- 1. Obter ID do Usuário
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'teste@email.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado';
        RETURN;
    END IF;

    -- 2. Limpeza (Reset)
    DELETE FROM public.order_items WHERE user_id = target_user_id;
    DELETE FROM public.orders WHERE user_id = target_user_id;
    DELETE FROM public.product_ingredients WHERE user_id = target_user_id;
    DELETE FROM public.products WHERE user_id = target_user_id;
    DELETE FROM public.ingredients WHERE user_id = target_user_id;
    DELETE FROM public.fixed_costs WHERE user_id = target_user_id;
    DELETE FROM public.customers WHERE user_id = target_user_id;
    DELETE FROM public.user_settings WHERE user_id = target_user_id;

    -- 3. Configurações
    INSERT INTO public.user_settings (user_id, business_name, target_margin, tax_and_loss_percent, estimated_monthly_billing)
    VALUES (target_user_id, 'Burger King dos Testes', 25, 12, 45000);

    INSERT INTO public.fixed_costs (user_id, name, amount) VALUES 
    (target_user_id, 'Aluguel Loja', 3500),
    (target_user_id, 'Funcionários (3)', 6000),
    (target_user_id, 'Energia/Água', 800),
    (target_user_id, 'Marketing', 500),
    (target_user_id, 'Contador', 400);

    -- 4. Ingredientes (Base de Burger)
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Pão Brioche', 'un', 12, 18.00, 100, 100, 24) RETURNING id INTO i_pao;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Blend Carne (Acém/Peito)', 'kg', 1, 28.90, 95, 20, 5) RETURNING id INTO i_carne;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Queijo Cheddar Fatiado', 'kg', 1, 65.00, 100, 5, 1) RETURNING id INTO i_queijo;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Bacon Fatiado', 'kg', 1, 45.00, 60, 3, 1) RETURNING id INTO i_bacon;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Alface Americana', 'un', 1, 4.00, 90, 10, 2) RETURNING id INTO i_alface;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Tomate Italiano', 'kg', 1, 8.00, 90, 5, 2) RETURNING id INTO i_tomate;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Cebola Roxa', 'kg', 1, 5.00, 85, 5, 2) RETURNING id INTO i_cebola;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Picles em Conserva', 'kg', 2, 25.00, 100, 2, 0.5) RETURNING id INTO i_picles;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Maionese Hellmanns', 'kg', 3, 45.00, 100, 1, 0.5) RETURNING id INTO i_maionese;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Batata Palito Congelada', 'kg', 2, 18.00, 100, 50, 10) RETURNING id INTO i_batata;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Óleo de Algodão', 'l', 15, 120.00, 100, 30, 15) RETURNING id INTO i_oleo;
    INSERT INTO public.ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock) VALUES
    (target_user_id, 'Coca-Cola Lata', 'un', 12, 30.00, 100, 48, 24) RETURNING id INTO i_refri;

    -- 5. Produtos
    -- Smash Burger
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method) VALUES
    (target_user_id, 'Smash Simples', 'Lanches', 'Pão, carne 100g, queijo e molho.', 22.00, '1. Selar pão na chapa. 2. Esmagar carne (smash). 3. Derreter queijo. 4. Montar.') RETURNING id INTO p_smash;
    INSERT INTO public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, unit_used) VALUES
    (target_user_id, p_smash, i_pao, 1, 'un'),
    (target_user_id, p_smash, i_carne, 100, 'g'),
    (target_user_id, p_smash, i_queijo, 30, 'g'),
    (target_user_id, p_smash, i_maionese, 20, 'g');

    -- X-Bacon
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method) VALUES
    (target_user_id, 'Classic Bacon', 'Lanches', 'Pão, carne 160g, muito bacon e cheddar.', 32.00, '1. Grelhar carne 160g. 2. Tostar bacon. 3. Montar com salada.') RETURNING id INTO p_xbacon;
    INSERT INTO public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, unit_used) VALUES
    (target_user_id, p_xbacon, i_pao, 1, 'un'),
    (target_user_id, p_xbacon, i_carne, 160, 'g'),
    (target_user_id, p_xbacon, i_bacon, 40, 'g'),
    (target_user_id, p_xbacon, i_queijo, 30, 'g'),
    (target_user_id, p_xbacon, i_alface, 0.1, 'un'),
    (target_user_id, p_xbacon, i_tomate, 40, 'g');

    -- Batata Frita
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method) VALUES
    (target_user_id, 'Fritas Individual', 'Porções', 'Batata crocante 200g.', 12.00, 'Fritar a 180 graus por 4 min.') RETURNING id INTO p_fritas;
    INSERT INTO public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, unit_used) VALUES
    (target_user_id, p_fritas, i_batata, 200, 'g'),
    (target_user_id, p_fritas, i_oleo, 30, 'ml');

    -- Coca
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method) VALUES
    (target_user_id, 'Coca-Cola', 'Bebidas', 'Lata 350ml gelada.', 6.00, 'Servir com gelo e limão opcional.') RETURNING id INTO p_coca;
    INSERT INTO public.product_ingredients (user_id, product_id, ingredient_id, quantity_used, unit_used) VALUES
    (target_user_id, p_coca, i_refri, 1, 'un');

    -- Combo 1
    INSERT INTO public.products (user_id, name, category, description, current_price, preparation_method) VALUES
    (target_user_id, 'Combo Smash', 'Combos', 'Smash + Fritas P + Refri.', 35.00, 'Montar itens do combo.') RETURNING id INTO p_combo1;
    -- (Receita simplificada para combo, ideal seria compor produtos, mas aqui vamos por ingredientes diretos ou ignorar para simplificar o script)

    -- 6. Clientes
    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date) VALUES
    (target_user_id, 'Carlos Almeida', '11999991111', 'carlos@teste.com', 0, NULL) RETURNING id INTO c1;
    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date) VALUES
    (target_user_id, 'Ana Beatriz', '11999992222', 'ana@teste.com', 0, NULL) RETURNING id INTO c2;
    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date) VALUES
    (target_user_id, 'Marcos Souza', '11999993333', 'marcos@teste.com', 0, NULL) RETURNING id INTO c3;
    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date) VALUES
    (target_user_id, 'Fernanda Lima', '11999994444', 'fe@teste.com', 0, NULL) RETURNING id INTO c4;
    INSERT INTO public.customers (user_id, name, phone, email, total_spent, last_order_date) VALUES
    (target_user_id, 'Roberto Justus', '11999995555', 'justus@teste.com', 0, NULL) RETURNING id INTO c5;

    -- 7. Vendas (Loop de 6 meses)
    current_sale_date := start_date;
    
    WHILE current_sale_date <= NOW() LOOP
        -- Define quantos pedidos teremos neste dia (random entre 0 e 5)
        -- Sextas e Sábados vendem mais (até 8)
        IF EXTRACT(DOW FROM current_sale_date) IN (5, 6) THEN
             daily_orders := floor(random() * 8 + 1)::int;
        ELSE
             daily_orders := floor(random() * 4)::int;
        END IF;

        FOR k IN 1..daily_orders LOOP
            -- Criar Pedido
            INSERT INTO public.orders (user_id, customer_id, customer_name, total_amount, payment_method, status, date)
            VALUES (
                target_user_id, 
                (ARRAY[c1, c2, c3, c4, c5, NULL])[floor(random() * 6 + 1)], -- Random customer or Guest
                'Cliente', -- Placeholder name logic simplify
                0, -- Will update later
                (ARRAY['credit', 'debit', 'pix', 'money'])[floor(random() * 4 + 1)],
                'completed',
                current_sale_date + (random() * interval '12 hours') + interval '11 hours' -- Horário comercial
            ) RETURNING id INTO new_order_id;

            -- Adicionar Itens (1 a 3 itens por pedido)
            -- Item 1 (Principal)
            IF random() > 0.5 THEN
                INSERT INTO public.order_items (user_id, order_id, product_id, product_name, quantity, unit_price, total)
                VALUES (target_user_id, new_order_id, p_smash, 'Smash Simples', 1, 22.00, 22.00);
            ELSE
                INSERT INTO public.order_items (user_id, order_id, product_id, product_name, quantity, unit_price, total)
                VALUES (target_user_id, new_order_id, p_xbacon, 'Classic Bacon', 1, 32.00, 32.00);
            END IF;

            -- Item 2 (Acompanhamento - 60% chance)
            IF random() > 0.4 THEN
                INSERT INTO public.order_items (user_id, order_id, product_id, product_name, quantity, unit_price, total)
                VALUES (target_user_id, new_order_id, p_fritas, 'Fritas Individual', 1, 12.00, 12.00);
            END IF;

            -- Item 3 (Bebida - 70% chance)
            IF random() > 0.3 THEN
                INSERT INTO public.order_items (user_id, order_id, product_id, product_name, quantity, unit_price, total)
                VALUES (target_user_id, new_order_id, p_coca, 'Coca-Cola', 1, 6.00, 6.00);
            END IF;

            -- Atualizar Total do Pedido
            UPDATE public.orders 
            SET total_amount = (SELECT SUM(total) FROM public.order_items WHERE order_id = new_order_id)
            WHERE id = new_order_id;

        END LOOP;

        current_sale_date := current_sale_date + interval '1 day';
    END LOOP;

    -- Atualizar LTV dos Clientes
    UPDATE public.customers c
    SET total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders o WHERE o.customer_id = c.id),
        last_order_date = (SELECT MAX(date) FROM public.orders o WHERE o.customer_id = c.id)
    WHERE user_id = target_user_id;

    RAISE NOTICE 'Banco de dados populado com sucesso para %!', target_user_id;
END $$;
