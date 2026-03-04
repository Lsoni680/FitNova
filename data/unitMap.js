// data/unitMap.js
// ========================================================
// ✅ Unit → grams base map (default conversions)
// Food-specific overrides are handled in nutritionEngine
// ========================================================

export const UNIT_TO_GRAM = {
  grams: 1,
  milligrams: 0.001,
  kilograms: 1000,
  ounces: 28.35,
  pounds: 453.6,

  cups: 240,
  tablespoons: 15,
  teaspoons: 5,

  // defaults (engine overrides when needed)
  pieces: 50,
  slices: 25,
  bowls: 250,
  servings: 100,
};
