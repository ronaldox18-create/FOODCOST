
import { Ingredient, Product, RecipeItem, AppSettings, CalculatedProduct, FixedCost } from '../types';

// Convert everything to base units: g, ml, un
const getBaseMultiplier = (unit: string): number => {
  switch (unit) {
    case 'kg': return 1000;
    case 'l': return 1000;
    case 'g':
    case 'ml':
    case 'un':
    default: return 1;
  }
};

const normalizeQuantity = (quantity: number, unit: string): number => {
  return quantity * getBaseMultiplier(unit);
};

export const calculateIngredientCost = (
  ingredient: Ingredient,
  quantityUsed: number,
  unitUsed: string
): number => {
  const basePurchaseQty = normalizeQuantity(ingredient.purchaseQuantity, ingredient.purchaseUnit);
  if (basePurchaseQty === 0) return 0;
  
  // Fator de Correção (Yield Logic)
  // Se aproveitamos apenas 80% (0.8), o preço efetivo aumenta.
  // Ex: Comprei 1kg por R$ 10. Aproveito 0.5kg. O custo real do kg utilizado é R$ 20.
  const yieldFactor = (ingredient.yieldPercent || 100) / 100;
  
  // Evitar divisão por zero se yield for 0 (embora não deva acontecer)
  const effectiveYield = yieldFactor > 0 ? yieldFactor : 1;

  const pricePerBaseUnit = ingredient.purchasePrice / (basePurchaseQty * effectiveYield);
  const baseUsedQty = normalizeQuantity(quantityUsed, unitUsed);

  return pricePerBaseUnit * baseUsedQty;
};

export const calculateProductMetrics = (
  product: Product,
  ingredients: Ingredient[],
  fixedCosts: FixedCost[],
  settings: AppSettings
): CalculatedProduct => {
  // 1. Calculate Ingredients Cost (CMV)
  let costIngredients = 0;
  product.recipe.forEach(item => {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    if (ingredient) {
      costIngredients += calculateIngredientCost(ingredient, item.quantityUsed, item.unitUsed);
    }
  });

  // 2. Calculate Overhead Percentages
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  // Avoid division by zero
  const estimatedBilling = settings.estimatedMonthlyBilling > 0 ? settings.estimatedMonthlyBilling : 1;
  
  const fixedCostPercent = totalFixedCosts / estimatedBilling; // e.g., 0.25 (25%)
  const variableCostPercent = settings.taxAndLossPercent / 100; // e.g., 0.12 (12%)
  const targetProfitPercent = settings.targetMargin / 100; // e.g., 0.20 (20%)

  // 3. Calculate Pricing (Markup Divisor Method)
  // Price = CostIngredients / (1 - (Fixed% + Variable% + Profit%))
  const totalDeductions = fixedCostPercent + variableCostPercent + targetProfitPercent;
  const divisor = 1 - totalDeductions;
  
  // If deductions >= 100%, price is impossible (infinite)
  const suggestedPrice = (divisor > 0.01) ? costIngredients / divisor : 0;

  // 4. Calculate Current Reality based on `currentPrice`
  // We distribute the revenue slice:
  // Revenue - Variable - Fixed - Ingredients = Profit
  
  let costFixed = 0;
  let costVariable = 0;
  let currentMargin = 0;
  let totalCost = 0;

  if (product.currentPrice > 0) {
    // Allocation based on current price
    costVariable = product.currentPrice * variableCostPercent;
    costFixed = product.currentPrice * fixedCostPercent;
    totalCost = costIngredients + costFixed + costVariable;
    
    // Net Profit
    const netProfit = product.currentPrice - totalCost;
    currentMargin = (netProfit / product.currentPrice) * 100;
  } else {
    // If price is 0, margin is -100%
    currentMargin = -100;
  }

  return {
    ...product,
    costIngredients,
    costFixed,
    costVariable,
    totalCost,
    suggestedPrice,
    currentMargin,
    isProfitable: currentMargin >= settings.targetMargin,
    breakdown: {
      fixedCostPercent: fixedCostPercent * 100,
      variableCostPercent: variableCostPercent * 100,
      profitPercent: targetProfitPercent * 100
    }
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const formatPercent = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(val / 100);
};
