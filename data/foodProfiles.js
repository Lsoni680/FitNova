// data/foodProfiles.js
// ========================================================
// ✅ Local Food Profiles (India + common global foods)
// Values are PER SERVING (grams + macros for that serving)
// Used FIRST for accuracy. If not matched → USDA gateway fallback.
// ========================================================

export const FOOD_PROFILES = [
  // --------------------------
  // Eggs & Dairy
  // --------------------------
  {
    key: "egg",
    grams: 50,
    macros: { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
    aliases: ["egg", "eggs", "whole egg", "boiled egg", "fried egg"],
  },
  {
    key: "milk",
    grams: 250,
    macros: { calories: 150, protein: 8, carbs: 12, fat: 8 },
    aliases: ["milk", "whole milk", "full cream milk"],
  },
  {
    key: "yogurt",
    grams: 150,
    macros: { calories: 95, protein: 5, carbs: 8, fat: 4 },
    aliases: ["curd", "yogurt", "dahi"],
  },
  {
    key: "paneer",
    grams: 100,
    macros: { calories: 265, protein: 18, carbs: 6, fat: 20 },
    aliases: ["paneer", "cottage cheese"],
  },
  {
    key: "tofu",
    grams: 100,
    macros: { calories: 76, protein: 8, carbs: 2, fat: 4 },
    aliases: ["tofu"],
  },

  // --------------------------
  // Indian breads
  // --------------------------
  {
    key: "roti",
    grams: 45,
    macros: { calories: 120, protein: 4, carbs: 20, fat: 3 },
    aliases: ["roti", "chapati", "phulka"],
  },
  {
    key: "paratha",
    grams: 75,
    macros: { calories: 260, protein: 6, carbs: 32, fat: 12 },
    aliases: ["paratha", "aloo paratha", "paneer paratha"],
  },
  {
    key: "naan",
    grams: 90,
    macros: { calories: 260, protein: 8, carbs: 45, fat: 6 },
    aliases: ["naan", "butter naan", "garlic naan"],
  },

  // --------------------------
  // Rice & grains (cooked)
  // --------------------------
  {
    key: "rice_cooked",
    grams: 100,
    macros: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    aliases: ["rice", "cooked rice", "steamed rice", "white rice"],
  },
  {
    key: "jeera_rice",
    grams: 150,
    macros: { calories: 210, protein: 4, carbs: 45, fat: 3 },
    aliases: ["jeera rice", "cumin rice"],
  },
  {
    key: "oats",
    grams: 40,
    macros: { calories: 150, protein: 5, carbs: 27, fat: 3 },
    aliases: ["oats", "rolled oats", "oatmeal"],
  },

  // --------------------------
  // Indian dals / legumes (cooked)
  // --------------------------
  {
    key: "dal_generic",
    grams: 150,
    macros: { calories: 174, protein: 13.5, carbs: 30, fat: 0.6 },
    aliases: ["dal", "dal fry", "lentil dal"],
  },
  {
    key: "toor_dal",
    grams: 150,
    macros: { calories: 180, protein: 12, carbs: 31, fat: 1.5 },
    aliases: ["toor dal", "arhar dal"],
  },
  {
    key: "masoor_dal",
    grams: 150,
    macros: { calories: 174, protein: 13.5, carbs: 30, fat: 0.6 },
    aliases: ["masoor dal", "red lentils"],
  },
  {
    key: "rajma",
    grams: 150,
    macros: { calories: 190, protein: 13, carbs: 34, fat: 1 },
    aliases: ["rajma", "kidney beans curry", "rajma chawal"],
  },
  {
    key: "chole",
    grams: 150,
    macros: { calories: 246, protein: 13.5, carbs: 40.5, fat: 3.9 },
    aliases: ["chole", "chana masala", "chickpeas curry"],
  },
  {
    key: "sambar",
    grams: 150,
    macros: { calories: 120, protein: 6, carbs: 18, fat: 3 },
    aliases: ["sambar", "sambhar"],
  },

  // --------------------------
  // Indian breakfast
  // --------------------------
  {
    key: "idli",
    grams: 50,
    macros: { calories: 58, protein: 2, carbs: 12, fat: 0.4 },
    aliases: ["idli", "idlies"],
  },
  {
    key: "dosa",
    grams: 120,
    macros: { calories: 168, protein: 4, carbs: 28, fat: 4 },
    aliases: ["dosa", "masala dosa", "plain dosa"],
  },
  {
    key: "poha",
    grams: 150,
    macros: { calories: 180, protein: 4, carbs: 30, fat: 5 },
    aliases: ["poha", "kanda poha"],
  },
  {
    key: "upma",
    grams: 150,
    macros: { calories: 190, protein: 5, carbs: 28, fat: 6 },
    aliases: ["upma", "uppuma"],
  },

  // --------------------------
  // Proteins
  // --------------------------
  {
    key: "chicken_breast_cooked",
    grams: 100,
    macros: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    aliases: [
      "chicken breast",
      "skinless chicken breast",
      "grilled chicken breast",
      "boiled chicken breast",
    ],
  },
  {
    key: "chicken_curry",
    grams: 150,
    macros: { calories: 240, protein: 20, carbs: 6, fat: 14 },
    aliases: ["chicken curry", "chicken gravy", "butter chicken"],
  },
  {
    key: "salmon",
    grams: 100,
    macros: { calories: 208, protein: 20, carbs: 0, fat: 13 },
    aliases: ["salmon", "salmon fillet", "atlantic salmon", "grilled salmon"],
  },
  {
    key: "fish_curry",
    grams: 150,
    macros: { calories: 220, protein: 22, carbs: 5, fat: 12 },
    aliases: ["fish curry", "fish gravy"],
  },

  // --------------------------
  // Fruits
  // --------------------------
  {
    key: "banana",
    grams: 120,
    macros: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    aliases: ["banana"],
  },
  {
    key: "apple",
    grams: 180,
    macros: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    aliases: ["apple"],
  },
  {
    key: "orange",
    grams: 130,
    macros: { calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
    aliases: ["orange", "mandarin", "kinnu"],
  },

  // --------------------------
  // Common global foods
  // --------------------------
  {
    key: "bread_slice",
    grams: 30,
    macros: { calories: 80, protein: 3, carbs: 15, fat: 1 },
    aliases: ["bread", "toast", "bread slice", "white bread"],
  },
  {
    key: "pasta_cooked",
    grams: 100,
    macros: { calories: 160, protein: 5.5, carbs: 31, fat: 1 },
    aliases: ["pasta", "cooked pasta"],
  },
  {
    key: "noodles_cooked",
    grams: 100,
    macros: { calories: 138, protein: 4.5, carbs: 25, fat: 2 },
    aliases: ["noodles", "cooked noodles", "hakka noodles"],
  },
  {
    key: "pizza_slice",
    grams: 110,
    macros: { calories: 285, protein: 12, carbs: 36, fat: 10 },
    aliases: ["pizza", "pizza slice", "cheese pizza"],
  },
  {
    key: "burger",
    grams: 150,
    macros: { calories: 250, protein: 13, carbs: 30, fat: 9 },
    aliases: ["burger", "chicken burger", "beef burger"],
  },
  {
    key: "sandwich",
    grams: 180,
    macros: { calories: 300, protein: 12, carbs: 35, fat: 12 },
    aliases: ["sandwich"],
  },

  // --------------------------
  // Sushi (per piece)
  // --------------------------
  {
    key: "sushi_generic",
    grams: 40,
    macros: { calories: 60, protein: 4, carbs: 8, fat: 1 },
    aliases: ["sushi"],
  },
  {
    key: "nigiri",
    grams: 40,
    macros: { calories: 65, protein: 5, carbs: 7, fat: 1 },
    aliases: ["nigiri", "salmon nigiri", "tuna nigiri"],
  },
  {
    key: "maki",
    grams: 25,
    macros: { calories: 35, protein: 2, carbs: 6, fat: 0.5 },
    aliases: ["maki", "roll", "sushi roll", "maki roll"],
  },
  {
    key: "sashimi",
    grams: 25,
    macros: { calories: 30, protein: 6, carbs: 0, fat: 0.5 },
    aliases: ["sashimi"],
  },
];

export function normalizeText(x) {
  return String(x || "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function findFoodProfile(query) {
  const q = normalizeText(query);
  if (!q) return null;

  // Exact match
  for (const p of FOOD_PROFILES) {
    if (p.aliases?.some((a) => normalizeText(a) === q)) return p;
  }

  // Contains match (helps: "chicken breast 100g" etc.)
  for (const p of FOOD_PROFILES) {
    if (p.aliases?.some((a) => q.includes(normalizeText(a)))) return p;
  }

  return null;
}
