// services/nutritionApi.js
// ========================================================
// ✅ USDA via Secure Gateway (Cloud Run / Firebase Gen2)
// Google/Play Policy friendly: app does NOT call USDA directly
// Returns { foods: [...], best: { ..., macrosPer100g } }
// ========================================================

const API_GATEWAY_URL = "https://apigateway-zridd3wcvq-uc.a.run.app";

export async function searchUSDA(query, preferredCooked = false) {
  const q = String(query || "").trim();
  if (!q) return { foods: [], best: null };

  const res = await fetch(API_GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, preferredCooked: !!preferredCooked }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || "Gateway request failed";
    throw new Error(msg);
  }

  // Normalize output shape
  return {
    foods: Array.isArray(data?.foods) ? data.foods : [],
    best: data?.best || null,
  };
}
