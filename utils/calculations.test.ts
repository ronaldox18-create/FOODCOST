import { describe, it, expect } from 'vitest';
import { calculateIngredientCost, calculateProductMetrics } from './calculations';
import { Ingredient, Product, AppSettings, FixedCost } from '../types';

describe('Calculations Utils', () => {
  describe('calculateIngredientCost', () => {
    it('deve calcular o custo corretamente para unidades simples (kg -> g)', () => {
      const ingredient: Ingredient = {
        id: '1',
        name: 'Farinha',
        purchasePrice: 10, // R$ 10
        purchaseQuantity: 1,
        purchaseUnit: 'kg',
        yieldPercent: 100,
        currentStock: 10,
        stockUnit: 'kg'
      };
      
      // Usando 500g (deve custar R$ 5)
      const cost = calculateIngredientCost(ingredient, 500, 'g');
      expect(cost).toBeCloseTo(5);
    });

    it('deve considerar o percentual de rendimento (yieldPercent)', () => {
      const ingredient: Ingredient = {
        id: '2',
        name: 'Batata',
        purchasePrice: 10, // R$ 10
        purchaseQuantity: 1,
        purchaseUnit: 'kg',
        yieldPercent: 50, // Perda de 50%, preço efetivo dobra -> R$ 20/kg
        currentStock: 10,
        stockUnit: 'kg'
      };

      // Usando 1kg limpo (deve custar R$ 20, pois precisou de 2kg sujos)
      const cost = calculateIngredientCost(ingredient, 1, 'kg');
      expect(cost).toBeCloseTo(20);
    });
  });

  describe('calculateProductMetrics', () => {
    const mockSettings: AppSettings = {
      id: '1',
      businessName: 'Test Biz',
      estimatedMonthlyBilling: 10000,
      taxAndLossPercent: 10,
      targetMargin: 20,
      created_at: '',
      user_id: ''
    };

    const mockFixedCosts: FixedCost[] = [
      { id: '1', name: 'Aluguel', amount: 2000, category: 'Operational', created_at: '', user_id: '' } // 20% do faturamento
    ];

    const mockIngredient: Ingredient = {
      id: '1',
      name: 'Carne',
      purchasePrice: 50,
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      yieldPercent: 100,
      currentStock: 10,
      stockUnit: 'kg'
    };

    const mockProduct: Product = {
      id: 'p1',
      name: 'Burger',
      currentPrice: 30,
      category: 'Food',
      recipe: [
        { ingredientId: '1', quantityUsed: 200, unitUsed: 'g' } // R$ 10 de custo (50 * 0.2)
      ],
      created_at: '',
      user_id: ''
    };

    it('deve calcular métricas de produto corretamente', () => {
      const result = calculateProductMetrics(
        mockProduct,
        [mockIngredient],
        mockFixedCosts,
        mockSettings
      );

      // Custo Ingredientes: 200g de R$50/kg = R$ 10
      expect(result.costIngredients).toBeCloseTo(10);

      // Percentuais:
      // Fixo: 2000 / 10000 = 20%
      // Variável: 10%
      // Lucro Alvo: 20%
      // Total Deduções: 50%
      // Divisor: 0.5
      
      // Preço Sugerido: 10 / 0.5 = 20
      expect(result.suggestedPrice).toBeCloseTo(20);

      // Métricas da Realidade Atual (Preço R$ 30)
      // Custo Fixo (alocado): 30 * 20% = 6
      // Custo Variável: 30 * 10% = 3
      // Custo Total: 10 + 6 + 3 = 19
      // Lucro Líquido: 30 - 19 = 11
      // Margem Atual: (11 / 30) * 100 = 36.66%

      expect(result.costFixed).toBeCloseTo(6);
      expect(result.costVariable).toBeCloseTo(3);
      expect(result.totalCost).toBeCloseTo(19);
      expect(result.currentMargin).toBeCloseTo(36.666, 2);
      expect(result.isProfitable).toBe(true); // 36.6% > 20% alvo
    });
  });
});
