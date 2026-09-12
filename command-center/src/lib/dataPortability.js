import { SCHEMA_VERSION } from './finance.js';
import { createRow, moneyToCents } from './format.js';
import { normalizeState } from './store.jsx';

const COST_HEADERS = ['name', 'category', 'trackingType', 'purchaseQuantity', 'purchaseUnit', 'purchaseCost', 'effectiveDate', 'active', 'notes'];
const VALID_CATEGORIES = new Set(['Food', 'Packaging', 'Beverage', 'Other']);
const VALID_TRACKING_TYPES = new Set(['input', 'direct-sale']);
const VALID_UNITS = new Set(['each', 'oz', 'lb', 'floz', 'cup', 'pint', 'quart', 'gallon']);

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportCostLibraryCsv(ingredients = []) {
  const rows = [COST_HEADERS];
  ingredients.forEach(item => {
    const history = [...(item.costHistory || [])].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    history.forEach(cost => {
      rows.push([
        item.name,
        item.category || 'Food',
        item.trackingType || 'input',
        cost.purchaseQuantity,
        cost.purchaseUnit,
        (Number(cost.purchaseCostCents || 0) / 100).toFixed(2),
        cost.effectiveDate,
        item.active === false ? 'false' : 'true',
        item.notes || '',
      ]);
    });
  });
  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  row.push(field);
  if (row.some(value => value !== '') || rows.length) rows.push(row);
  return rows;
}

function requireValue(row, key, rowNumber) {
  const value = String(row[key] ?? '').trim();
  if (!value) throw new Error(`CSV row ${rowNumber}: ${key} is required.`);
  return value;
}

export function importCostLibraryCsv(text) {
  const [headerRow, ...dataRows] = parseCsv(text.trim());
  if (!headerRow?.length) throw new Error('CSV is empty.');
  const normalizedHeaders = headerRow.map(value => value.trim());
  const missing = COST_HEADERS.filter(key => !normalizedHeaders.includes(key));
  if (missing.length) throw new Error(`CSV is missing required column(s): ${missing.join(', ')}.`);
  const records = dataRows.filter(row => row.some(value => String(value).trim())).map((values, index) => {
    const row = Object.fromEntries(normalizedHeaders.map((key, keyIndex) => [key, values[keyIndex] ?? '']));
    const rowNumber = index + 2;
    const category = requireValue(row, 'category', rowNumber);
    const trackingType = requireValue(row, 'trackingType', rowNumber);
    const purchaseUnit = requireValue(row, 'purchaseUnit', rowNumber);
    if (!VALID_CATEGORIES.has(category)) throw new Error(`CSV row ${rowNumber}: category must be Food, Packaging, Beverage, or Other.`);
    if (!VALID_TRACKING_TYPES.has(trackingType)) throw new Error(`CSV row ${rowNumber}: trackingType must be input or direct-sale.`);
    if (!VALID_UNITS.has(purchaseUnit)) throw new Error(`CSV row ${rowNumber}: purchaseUnit is not supported.`);
    return {
      name: requireValue(row, 'name', rowNumber),
      category,
      trackingType,
      purchaseQuantity: requireValue(row, 'purchaseQuantity', rowNumber),
      purchaseUnit,
      purchaseCostCents: moneyToCents(requireValue(row, 'purchaseCost', rowNumber)),
      effectiveDate: requireValue(row, 'effectiveDate', rowNumber),
      active: String(row.active || 'true').trim().toLowerCase() !== 'false',
      notes: String(row.notes || '').trim(),
    };
  });

  const grouped = new Map();
  records.forEach(record => {
    const key = record.name.toLowerCase();
    const existing = grouped.get(key) || createRow({
      name: record.name,
      category: record.category,
      trackingType: record.trackingType,
      notes: record.notes,
      active: record.active,
      costHistory: [],
    });
    existing.name = record.name;
    existing.category = record.category;
    existing.trackingType = record.trackingType;
    existing.notes = record.notes || existing.notes;
    existing.active = record.active;
    const cost = {
      purchaseQuantity: record.purchaseQuantity,
      purchaseUnit: record.purchaseUnit,
      purchaseCostCents: record.purchaseCostCents,
      effectiveDate: record.effectiveDate,
    };
    const costIndex = existing.costHistory.findIndex(row => row.effectiveDate === cost.effectiveDate);
    if (costIndex >= 0) existing.costHistory[costIndex] = cost;
    else existing.costHistory.push(cost);
    existing.costHistory.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    grouped.set(key, existing);
  });
  return [...grouped.values()];
}

export function normalizeImportedJson(parsed) {
  const normalized = normalizeState(parsed);
  normalized.meta = {
    schemaVersion: SCHEMA_VERSION,
    revision: Number(normalized.meta.revision) || 0,
    updatedAt: new Date().toISOString(),
  };
  return normalized;
}

