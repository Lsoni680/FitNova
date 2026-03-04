/**
 * FitNova Nutrition Engine (Single Source of Truth)
 * -------------------------------------------------
 * ✅ Verified foods (Indian + global)
 * ✅ Unit -> grams conversion
 * ✅ Cooked/raw preference hints
 * ✅ Gateway call (secure server)
 * ✅ Same output for NutritionScreen + FoodInputHubScreen
 *
 * NOTE:
 * - This engine returns BOTH:
 *   - scaledMacros   (lowercase keys: calories/protein/carbs/fat/grams) ✅ used by NutritionScreen
 *   - scaledMacrosDiary (FoodInputHub format: Calories/Protein/Carbohydrates/Fat/grams) ✅ used by FoodInputHubScreen
 */

const API_GATEWAY_URL = "https://analyzefoodnutritionhttp-zridd3wcvq-uc.a.run.app";

/* ---------------- Helpers ---------------- */

export function safeNum(v, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeFoodKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function lc(x) {
  return String(x || "").toLowerCase().trim();
}

/* ---------------- Verified Foods (Per FIXED grams) ---------------- */
/**
 * grams = reference serving grams for the macros below
 * calories/protein/carbs/fat = values for that reference serving (NOT per 100g)
 */
const VERIFIED_FOODS = {
  // 🥚 Eggs
  "egg": { grams: 50, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },

  // 🇮🇳 Indian staples
  "roti": { grams: 45, calories: 120, protein: 4, carbs: 20, fat: 3 },
  "chapati": { grams: 45, calories: 120, protein: 4, carbs: 20, fat: 3 },
  "paratha": { grams: 75, calories: 260, protein: 6, carbs: 32, fat: 12 },

  "rice": { grams: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "jeera rice": { grams: 150, calories: 210, protein: 4, carbs: 45, fat: 3 },

  "dal": { grams: 100, calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  "masoor dal": { grams: 100, calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  "toor dal": { grams: 100, calories: 120, protein: 8, carbs: 21, fat: 1 },
  "rajma": { grams: 100, calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
  "chole": { grams: 100, calories: 164, protein: 9, carbs: 27, fat: 2.6 },
  "sambar": { grams: 150, calories: 120, protein: 6, carbs: 18, fat: 3 },

  "paneer": { grams: 100, calories: 265, protein: 18, carbs: 6, fat: 20 },
  "tofu": { grams: 100, calories: 76, protein: 8, carbs: 2, fat: 4 },

  // 🍳 Indian breakfast
  "idli": { grams: 50, calories: 58, protein: 2, carbs: 12, fat: 0.4 },
  "dosa": { grams: 120, calories: 168, protein: 4, carbs: 28, fat: 4 },
  "poha": { grams: 150, calories: 180, protein: 4, carbs: 30, fat: 5 },
  "upma": { grams: 150, calories: 190, protein: 5, carbs: 28, fat: 6 },

  // 🍗 Proteins
  "chicken breast": { grams: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  "chicken curry": { grams: 150, calories: 240, protein: 20, carbs: 6, fat: 14 },
  "fish curry": { grams: 150, calories: 220, protein: 22, carbs: 5, fat: 12 },
  "salmon": { grams: 100, calories: 208, protein: 20, carbs: 0, fat: 13 },

  // 🍔 Global foods
  "bread": { grams: 30, calories: 80, protein: 3, carbs: 15, fat: 1 },
  "toast": { grams: 30, calories: 80, protein: 3, carbs: 15, fat: 1 },
  "butter": { grams: 10, calories: 72, protein: 0, carbs: 0, fat: 8 },

  "milk": { grams: 250, calories: 150, protein: 8, carbs: 12, fat: 8 },
  "curd": { grams: 150, calories: 95, protein: 5, carbs: 8, fat: 4 },
  "yogurt": { grams: 150, calories: 95, protein: 5, carbs: 8, fat: 4 },

  "banana": { grams: 120, calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  "apple": { grams: 180, calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  "orange": { grams: 130, calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },

  "oats": { grams: 40, calories: 150, protein: 5, carbs: 27, fat: 3 },
  "cornflakes": { grams: 30, calories: 115, protein: 2, carbs: 26, fat: 0.3 },

  "pasta": { grams: 100, calories: 160, protein: 5.5, carbs: 31, fat: 1 },
  "noodles": { grams: 100, calories: 138, protein: 4.5, carbs: 25, fat: 2 },

  "pizza": { grams: 110, calories: 285, protein: 12, carbs: 36, fat: 10 },
  "burger": { grams: 150, calories: 250, protein: 13, carbs: 30, fat: 9 },
  "sandwich": { grams: 180, calories: 300, protein: 12, carbs: 35, fat: 12 },

  // 🍣 Sushi
  "sushi": { grams: 40, calories: 60, protein: 4, carbs: 8, fat: 1 },
  "nigiri": { grams: 40, calories: 65, protein: 5, carbs: 7, fat: 1 },
  "maki": { grams: 25, calories: 35, protein: 2, carbs: 6, fat: 0.5 },
  "sashimi": { grams: 25, calories: 30, protein: 6, carbs: 0, fat: 0.5 },
};

/* ---------------- Units ---------------- */

export const UNITS = [
  { label: "Grams (g)", value: "grams", factor: 1 },
  { label: "Milligrams (mg)", value: "milligrams", factor: 0.001 },
  { label: "Kilograms (kg)", value: "kilograms", factor: 1000 },
  { label: "Ounces (oz)", value: "ounces", factor: 28.35 },
  { label: "Pounds (lb)", value: "pounds", factor: 453.6 },

  { label: "Teaspoons (tsp)", value: "teaspoons", factor: 5 },
  { label: "Tablespoons (tbsp)", value: "tablespoons", factor: 15 },
  { label: "Cups", value: "cups", factor: 240 },

  { label: "Pieces (pcs)", value: "pieces", factor: 50 }, // default
  { label: "Slices", value: "slices", factor: 25 },       // default
  { label: "Bowls", value: "bowls", factor: 250 },        // default
  { label: "Servings", value: "servings", factor: 100 },
];

/* -------- Portion override grams for better accuracy -------- */

export function getPortionOverrideGrams(foodName, unitValue) {
  const f = lc(foodName);

  // Pizza: 1 slice ~ 110g
  if (f.includes("pizza") && unitValue === "slices") return 110;

  // Rice cooked: 1 bowl ~ 250g
  if (f.includes("rice") && unitValue === "bowls") return 250;

  // Dal/Lentils cooked: 1 bowl ~ 250g
  if (
    (f.includes("dal") || f.includes("lentil") || f.includes("masoor")) &&
    unitValue === "bowls"
  ) {
    return 250;
  }

  // Sushi pieces
  if (unitValue === "pieces") {
    if (f.includes("sashimi")) return 25;
    if (f.includes("maki") || f.includes("roll")) return 25;
    if (f.includes("nigiri")) return 40;
    if (f.includes("sushi")) return 40;
  }

  return null;
}

export function shouldPreferCooked(foodName, unitValue) {
  const f = lc(foodName);
  const cookedUnits = ["bowls", "cups", "slices", "servings", "pieces"];
  if (!cookedUnits.includes(unitValue)) return false;

  if (f.includes("rice")) return true;
  if (f.includes("dal") || f.includes("lentil") || f.includes("masoor")) return true;
  if (f.includes("pizza")) return true;
  if (f.includes("sushi") || f.includes("nigiri") || f.includes("maki") || f.includes("roll"))
    return true;

  return false;
}

export function getDefaultUnitForFood(foodName) {
  const f = lc(foodName);
  if (!f) return "pieces";

  if (f.includes("rice") || f.includes("dal") || f.includes("lentil") || f.includes("masoor"))
    return "bowls";
  if (f.includes("pizza")) return "slices";
  if (f.includes("milk") || f.includes("juice")) return "cups";
  if (f.includes("sushi") || f.includes("nigiri") || f.includes("maki") || f.includes("sashimi") || f.includes("roll"))
    return "pieces";
  if (f.includes("egg")) return "pieces";

  return "pieces";
}

function getGramsForUnit(foodName, unitValue) {
  const override = getPortionOverrideGrams(foodName, unitValue);
  if (override != null) return override;

  const base = UNITS.find((u) => u.value === unitValue)?.factor;
  return base ?? 1;
}

/* ---------------- Gateway ---------------- */

async function callGateway(foodName, preferredCooked) {
  const r = await fetch(API_GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      foodName,          // correct key for backend
      preferredCooked,
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = data?.error || "Gateway request failed";
    throw new Error(err);
  }
  return data;
}

function extractMacrosFromGateway(data) {

  // ✅ NEW backend format
  if (
    data?.calories !== undefined &&
    data?.protein !== undefined &&
    data?.carbs !== undefined &&
    data?.fat !== undefined
  ) {
    return {
      calories: safeNum(data.calories, 0),
      protein: safeNum(data.protein, 0),
      carbs: safeNum(data.carbs, 0),
      fat: safeNum(data.fat, 0),
    };
  }

  // ✅ OLD backend format
  const m = data?.best?.macrosPer100g;
  if (!m) return null;

  return {
    calories: safeNum(m.calories, 0),
    protein: safeNum(m.protein, 0),
    carbs: safeNum(m.carbs, 0),
    fat: safeNum(m.fat, 0),
  };
}


/* ---------------- Main API ---------------- */

export async function analyzeFood({ foodName, quantity, unitValue, preferredCooked }) {

  const name = String(foodName || "").trim();
  const qty = safeNum(quantity, 0);
  const unit = unitValue || "pieces";

  if (!name) return { ok: false, error: "Missing food name" };
  if (!qty || qty <= 0) return { ok: false, error: "Invalid quantity" };

  // grams
  const grams = unit === "grams" ? qty : qty * getGramsForUnit(name, unit);
  const factor = grams / 100;

  /* -------- VERIFIED foods -------- */

  const key = normalizeFoodKey(name);
  const verified = VERIFIED_FOODS[key];

  if (verified) {
    const per100g = {
      calories: (verified.calories / verified.grams) * 100,
      protein: (verified.protein / verified.grams) * 100,
      carbs: (verified.carbs / verified.grams) * 100,
      fat: (verified.fat / verified.grams) * 100,
    };

    return {
      ok: true,
      source: "verified",
      grams,
      scaledMacros: {
        grams,
        calories: Math.round(per100g.calories * factor),
        protein: +(per100g.protein * factor).toFixed(1),
        carbs: +(per100g.carbs * factor).toFixed(1),
        fat: +(per100g.fat * factor).toFixed(1),
      },
      scaledMacrosDiary: {
        grams,
        Calories: Math.round(per100g.calories * factor),
        Protein: +(per100g.protein * factor).toFixed(1),
        Carbohydrates: +(per100g.carbs * factor).toFixed(1),
        Fat: +(per100g.fat * factor).toFixed(1),
      },
      per100g,
    };
  }

  /* -------- GATEWAY fallback -------- */

  try {
    const data = await callGateway(name, !!preferredCooked);
    const per100g = extractMacrosFromGateway(data);

    if (!per100g) {
      return { ok: false, error: "No macros found" };
    }

    return {
      ok: true,
      source: "gateway",
      grams,
      scaledMacros: {
        grams,
        calories: Math.round(per100g.calories * factor),
        protein: +(per100g.protein * factor).toFixed(1),
        carbs: +(per100g.carbs * factor).toFixed(1),
        fat: +(per100g.fat * factor).toFixed(1),
      },
      scaledMacrosDiary: {
        grams,
        Calories: Math.round(per100g.calories * factor),
        Protein: +(per100g.protein * factor).toFixed(1),
        Carbohydrates: +(per100g.carbs * factor).toFixed(1),
        Fat: +(per100g.fat * factor).toFixed(1),
      },
      per100g,
    };

  } catch (e) {
    return { ok: false, error: e.message || "Gateway failed" };
  }
}
