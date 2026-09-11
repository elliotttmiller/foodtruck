import test from 'node:test';
import assert from 'node:assert/strict';
import { dollarsToCents, ingredientCostCents, buildUsageSnapshot, calculateDailyReport, unitCompatible } from '../src/lib/finance.js';

test('currency parses and rounds deterministically', () => {
  assert.equal(dollarsToCents('42.90'), 4290);
  assert.equal(dollarsToCents('1.005'), 101);
});

test('10 lb case at $42.90 costs 327 oz exactly to the nearest cent', () => {
  const ingredient = { purchaseQuantity: '10', purchaseUnit: 'lb', purchaseCostCents: 4290 };
  assert.equal(ingredientCostCents(ingredient, '327', 'oz'), 8768);
});

test('unit dimensions must match', () => {
  assert.equal(unitCompatible('lb', 'oz'), true);
  assert.equal(unitCompatible('gallon', 'floz'), true);
  assert.equal(unitCompatible('lb', 'gallon'), false);
});

test('daily report excludes sales tax from net revenue and composes costs', () => {
  const ingredient = { id:'beef', name:'Ground Beef', category:'Food', purchaseQuantity:'10', purchaseUnit:'lb', purchaseCostCents:4290, effectiveDate:'2026-09-01' };
  const usage = buildUsageSnapshot(ingredient, { soldQty:'300', wasteQty:'10', compQty:'17', unit:'oz' });
  const report = calculateDailyReport({ grossSalesCents:250000, salesTaxCents:18000, discountsCents:0, refundsCents:0, usages:[usage], laborCostCents:60000, processingFeesCents:7000, directExpensesCents:13500, allocatedOverheadCents:14000 });
  assert.equal(report.revenueCents, 232000);
  assert.equal(report.ingredientCostCents, 8768);
  assert.equal(report.totalCostCents, 103268);
  assert.equal(report.operatingProfitCents, 128732);
});
