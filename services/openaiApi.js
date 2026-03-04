// services/openaiApi.js
// ========================================================
// FitNova - OpenAI via Firebase Gen-2 apiGateway (HTTP)
// ========================================================

const API_URL = "https://apigateway-zridd3wcvq-uc.a.run.app";

export async function testOpenAI() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "openai",
      payload: {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Suggest a healthy Indian breakfast" }],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.details?.error?.message ||
      data?.details?.message ||
      `OpenAI failed (${res.status})`;

    console.error("[apiGateway] openai error", res.status, data);
    throw new Error(msg);
  }

  return data;
}
