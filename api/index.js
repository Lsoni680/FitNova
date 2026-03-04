/**
 * FitNova/api/index.js
 * =====================================================
 * Gen2 HTTPS Functions (Node 20)
 * - analyzeFoodNutritionHttp: accepts foodName OR imageBase64
 * - apiGateway: USDA search proxy (keep if your app uses it)
 * =====================================================
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

const OPENAI_API_KEY_SECRET = "OPENAI_API_KEY";
const USDA_API_KEY_SECRET = "USDA_API_KEY";

/* ===================================================== */
/* HELPERS                                               */
/* ===================================================== */

function getSecret(req, name) {
  const v = process.env[name];
  if (!v) logger.warn(`Missing secret: ${name}`);
  return v;
}

function safeJson(res, code, payload) {
  res
    .status(code)
    .set("Content-Type", "application/json")
    .send(JSON.stringify(payload));
}

function cleanFoodName(s) {
  return String(s || "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ===================================================== */
/* OPENAI – FOOD NAME FROM IMAGE                         */
/* ===================================================== */

async function callOpenAIVision({ openaiKey, base64 }) {
  const prompt =
    "Identify the main food item in this image. " +
    "Return ONLY the food name (1-3 words), no punctuation, no explanation. " +
    "Examples: Banana, Pizza slice, Chicken curry, Dal, Boiled egg.";

  const body = {
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64}`,
          },
        ],
      },
    ],
    max_output_tokens: 30,
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = data?.error?.message || "OpenAI vision failed";
    throw new Error(err);
  }

  const text =
    data?.output?.[0]?.content?.[0]?.text ||
    data?.output_text ||
    "";

  return cleanFoodName(text);
}

/* ===================================================== */
/* OPENAI – MACRO ESTIMATION (FALLBACK)                  */
/* ===================================================== */

async function estimateMacrosFromImage({ openaiKey, base64, foodName }) {
  const body = {
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: base64
              ? "From this food image estimate nutrition. Return JSON only: {calories, protein, carbs, fat}"
              : `Estimate nutrition for ${foodName}. Return JSON only: {calories, protein, carbs, fat}`,
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64}`,
          },
        ],
      },
    ],
    max_output_tokens: 120,
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  const txt =
    data?.output?.[0]?.content?.[0]?.text ||
    data?.output_text ||
    "{}";

  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

/* ===================================================== */
/* USDA                                                   */
/* ===================================================== */

async function usdaSearchBest({ usdaKey, query }) {
  const url =
    "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=" +
    encodeURIComponent(usdaKey);

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      pageSize: 5,
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error?.message || "USDA request failed";
    throw new Error(msg);
  }

  const foods = Array.isArray(data?.foods) ? data.foods : [];
  return foods[0] || null;
}

function extractMacrosPer100g(usdaFood) {
  const list = Array.isArray(usdaFood?.foodNutrients)
    ? usdaFood.foodNutrients
    : [];

  const find = (name) => {
    const n = list.find(
      (x) =>
        String(x?.nutrientName || "").toLowerCase() ===
        name.toLowerCase()
    );
    return n?.value ?? null;
  };

  const calories =
    find("Energy") ??
    find("Energy (Atwater General Factors)") ??
    find("Energy (Atwater Specific Factors)") ??
    null;

  const protein = find("Protein");
  const carbs =
    find("Carbohydrate, by difference") ??
    find("Carbohydrate");
  const fat =
    find("Total lipid (fat)") ??
    find("Total Fat");

  return {
    calories: calories != null ? Number(calories) : 0,
    protein: protein != null ? Number(protein) : 0,
    carbs: carbs != null ? Number(carbs) : 0,
    fat: fat != null ? Number(fat) : 0,
  };
}

/* ===================================================== */
/* MAIN FUNCTION                                         */
/* ===================================================== */

exports.analyzeFoodNutritionHttp = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [OPENAI_API_KEY_SECRET, USDA_API_KEY_SECRET],
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return safeJson(res, 405, { error: "Use POST" });
        }

        const openaiKey = getSecret(req, OPENAI_API_KEY_SECRET);
        const usdaKey = getSecret(req, USDA_API_KEY_SECRET);

        if (!usdaKey)
          return safeJson(res, 500, {
            error: "USDA key missing",
          });

        const body = req.body || {};
        let foodName = cleanFoodName(body.foodName);

        const imageBase64 = body.imageBase64
          ? String(body.imageBase64)
          : "";

        /* IMAGE → FOOD NAME */
        if (imageBase64) {
          if (!openaiKey)
            return safeJson(res, 500, {
              error: "OPENAI key missing",
            });

          foodName = await callOpenAIVision({
            openaiKey,
            base64: imageBase64,
          });

          if (!foodName) foodName = "Food";
        }

        if (!foodName) {
          return safeJson(res, 400, {
            error: "foodName required (or imageBase64)",
          });
        }

        /* ---- USDA FIRST ---- */
        let macros;
        const best = await usdaSearchBest({
          usdaKey,
          query: foodName,
        });

        if (best) {
          macros = extractMacrosPer100g(best);
        } else {
          // 🌍 GLOBAL AI fallback (TEXT + IMAGE)
          if (!openaiKey) {
          return safeJson(res, 500, { error: "OPENAI key missing" });
        }

        macros = await estimateMacrosFromImage({
          openaiKey,
          base64: imageBase64 || null,
          foodName,
        });
      }

      if (!macros) {
        return safeJson(res, 404, {
          error: "Nutrition not found",
       });
      }

        

        return safeJson(res, 200, {
          foodName,
          ...macros,
          source: best ? "usda" : "ai",
        });
      } catch (e) {
        logger.error(e);
        return safeJson(res, 500, {
          error: e?.message || "Server error",
        });
      }
    });
  }
);

/* ===================================================== */
/* OPTIONAL USDA PROXY                                   */
/* ===================================================== */

exports.apiGateway = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: [USDA_API_KEY_SECRET],
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method !== "POST")
          return safeJson(res, 405, {
            error: "Use POST",
          });

        const usdaKey =
          process.env[USDA_API_KEY_SECRET];
        if (!usdaKey)
          return safeJson(res, 500, {
            error: "USDA key missing",
          });

        const q = cleanFoodName(
          req.body?.query || req.body?.foodName
        );

        if (!q)
          return safeJson(res, 400, {
            error: "query required",
          });

        const best = await usdaSearchBest({
          usdaKey,
          query: q,
        });

        if (!best)
          return safeJson(res, 200, {
            foods: [],
            best: null,
          });

        const macrosPer100g =
          extractMacrosPer100g(best);

        return safeJson(res, 200, {
          foods: [best],
          best: {
            foodName: q,
            macrosPer100g,
          },
        });
      } catch (e) {
        logger.error(e);
        return safeJson(res, 500, {
          error: e?.message || "Server error",
        });
      }
    });
  }
);
