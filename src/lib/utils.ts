// Shared helpers (unit normalization, date formatting, etc.)

export function formatMatchPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

// Maps common unit spellings to a shared base unit + conversion factor so
// quantities expressed in different-but-compatible units (e.g. "kg" vs "g",
// "tbsp" vs "cup") can be compared. Units not listed here (or across
// incompatible bases, e.g. "g" vs "ml") can't be converted.
const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  // Mass / Weight (base: 'g')
  mg: { base: "g", factor: 0.001 },
  milligram: { base: "g", factor: 0.001 },
  milligrams: { base: "g", factor: 0.001 },
  g: { base: "g", factor: 1 },
  gram: { base: "g", factor: 1 },
  grams: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  kilogram: { base: "g", factor: 1000 },
  kilograms: { base: "g", factor: 1000 },
  oz: { base: "g", factor: 28.3495 },
  ounce: { base: "g", factor: 28.3495 },
  ounces: { base: "g", factor: 28.3495 },
  lb: { base: "g", factor: 453.592 },
  lbs: { base: "g", factor: 453.592 },
  pound: { base: "g", factor: 453.592 },
  pounds: { base: "g", factor: 453.592 },

  // Volume (base: 'ml')
  ml: { base: "ml", factor: 1 },
  milliliter: { base: "ml", factor: 1 },
  milliliters: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
  liter: { base: "ml", factor: 1000 },
  liters: { base: "ml", factor: 1000 },
  tsp: { base: "ml", factor: 4.92892 },
  teaspoon: { base: "ml", factor: 4.92892 },
  teaspoons: { base: "ml", factor: 4.92892 },
  t: { base: "ml", factor: 4.92892 },
  ts: { base: "ml", factor: 4.92892 },
  tbsp: { base: "ml", factor: 14.7868 },
  tablespoon: { base: "ml", factor: 14.7868 },
  tablespoons: { base: "ml", factor: 14.7868 },
  tbs: { base: "ml", factor: 14.7868 },
  tbl: { base: "ml", factor: 14.7868 },
  tb: { base: "ml", factor: 14.7868 },
  "fl oz": { base: "ml", factor: 29.5735 },
  floz: { base: "ml", factor: 29.5735 },
  "fluid ounce": { base: "ml", factor: 29.5735 },
  "fluid ounces": { base: "ml", factor: 29.5735 },
  "fluid oz": { base: "ml", factor: 29.5735 },
  cup: { base: "ml", factor: 236.588 },
  cups: { base: "ml", factor: 236.588 },
  c: { base: "ml", factor: 236.588 },
  pt: { base: "ml", factor: 473.176 },
  pint: { base: "ml", factor: 473.176 },
  pints: { base: "ml", factor: 473.176 },
  qt: { base: "ml", factor: 946.353 },
  quart: { base: "ml", factor: 946.353 },
  quarts: { base: "ml", factor: 946.353 },
  gal: { base: "ml", factor: 3785.41 },
  gallon: { base: "ml", factor: 3785.41 },
  gallons: { base: "ml", factor: 3785.41 },
  pinch: { base: "ml", factor: 0.3 },
  pinches: { base: "ml", factor: 0.3 },
  dash: { base: "ml", factor: 0.6 },
  dashes: { base: "ml", factor: 0.6 },
  drop: { base: "ml", factor: 0.05 },
  drops: { base: "ml", factor: 0.05 },

  // Discrete Count (base: 'count')
  each: { base: "count", factor: 1 },
  ea: { base: "count", factor: 1 },
  count: { base: "count", factor: 1 },
  ct: { base: "count", factor: 1 },
  piece: { base: "count", factor: 1 },
  pieces: { base: "count", factor: 1 },
  pc: { base: "count", factor: 1 },
  pcs: { base: "count", factor: 1 },
  whole: { base: "count", factor: 1 },
  clove: { base: "count", factor: 1 },
  cloves: { base: "count", factor: 1 },
  slice: { base: "count", factor: 1 },
  slices: { base: "count", factor: 1 },
  can: { base: "count", factor: 1 },
  cans: { base: "count", factor: 1 },
  package: { base: "count", factor: 1 },
  packages: { base: "count", factor: 1 },
  pkg: { base: "count", factor: 1 },
  pkgs: { base: "count", factor: 1 },
  packet: { base: "count", factor: 1 },
  packets: { base: "count", factor: 1 },
  pouch: { base: "count", factor: 1 },
  pouches: { base: "count", factor: 1 },
  head: { base: "count", factor: 1 },
  heads: { base: "count", factor: 1 },
  stalk: { base: "count", factor: 1 },
  stalks: { base: "count", factor: 1 },
  bunch: { base: "count", factor: 1 },
  bunches: { base: "count", factor: 1 },
  stick: { base: "count", factor: 1 },
  sticks: { base: "count", factor: 1 },
  bottle: { base: "count", factor: 1 },
  bottles: { base: "count", factor: 1 },
  jar: { base: "count", factor: 1 },
  jars: { base: "count", factor: 1 },
  bag: { base: "count", factor: 1 },
  bags: { base: "count", factor: 1 },
  box: { base: "count", factor: 1 },
  boxes: { base: "count", factor: 1 },
  container: { base: "count", factor: 1 },
  containers: { base: "count", factor: 1 },
};

// Converts a quantity to its base unit (grams / milliliters / count).
// Returns null if the unit isn't recognized.
export function toBaseUnit(
  quantity: number,
  unit: string
): { value: number; base: string } | null {
  if (!unit) return null;
  const normalized = unit
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  const conversion = UNIT_CONVERSIONS[normalized];
  if (!conversion) return null;
  return { value: quantity * conversion.factor, base: conversion.base };
}
