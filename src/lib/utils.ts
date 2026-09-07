// Shared helpers (unit normalization, date formatting, etc.)

export function formatMatchPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

// Maps common unit spellings to a shared base unit + conversion factor so
// quantities expressed in different-but-compatible units (e.g. "kg" vs "g",
// "tbsp" vs "cup") can be compared. Units not listed here (or across
// incompatible bases, e.g. "g" vs "ml") can't be converted.
const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
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
  ml: { base: "ml", factor: 1 },
  milliliter: { base: "ml", factor: 1 },
  milliliters: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
  liter: { base: "ml", factor: 1000 },
  liters: { base: "ml", factor: 1000 },
  tsp: { base: "ml", factor: 4.92892 },
  teaspoon: { base: "ml", factor: 4.92892 },
  teaspoons: { base: "ml", factor: 4.92892 },
  tbsp: { base: "ml", factor: 14.7868 },
  tablespoon: { base: "ml", factor: 14.7868 },
  tablespoons: { base: "ml", factor: 14.7868 },
  cup: { base: "ml", factor: 236.588 },
  cups: { base: "ml", factor: 236.588 },
  pt: { base: "ml", factor: 473.176 },
  pint: { base: "ml", factor: 473.176 },
  qt: { base: "ml", factor: 946.353 },
  quart: { base: "ml", factor: 946.353 },
  gal: { base: "ml", factor: 3785.41 },
  gallon: { base: "ml", factor: 3785.41 },
  each: { base: "count", factor: 1 },
  count: { base: "count", factor: 1 },
  piece: { base: "count", factor: 1 },
  pieces: { base: "count", factor: 1 },
  whole: { base: "count", factor: 1 },
};

// Converts a quantity to its base unit (grams / milliliters / count).
// Returns null if the unit isn't recognized.
export function toBaseUnit(
  quantity: number,
  unit: string
): { value: number; base: string } | null {
  const conversion = UNIT_CONVERSIONS[unit.trim().toLowerCase()];
  if (!conversion) return null;
  return { value: quantity * conversion.factor, base: conversion.base };
}
