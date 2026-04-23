/**
 * /api/product - 상품명 → 무게/치수/분류코드 + 독일어 상품명
 *
 * 보안:
 *  - ANTHROPIC_API_KEY는 Netlify 환경변수에만 존재
 *  - 입력은 productName 단일 필드로 제한 (1~200자)
 *  - 응답은 정규화된 JSON
 */

const CATEGORY_CODES = [
  "001: 의류", "002: 구두/신발", "003: 가방", "004: 패션잡화",
  "005: 침구류/커튼", "006: 가구", "007: 영상가전(TV류)",
  "008: 가정용 전기제품", "009: 계절가전", "010: 사무용기기",
  "011: 광학기기", "012: 소형전자", "013: 휴대폰", "014: 내비게이션",
  "015: 자동차용품", "016: 의료기기", "017: 주방용품", "018: 화장품",
  "019: 귀금속/보석/시계류", "020: 농수축산물", "021: 가공식품",
  "022: 건강기능식품", "023: 어린이제품", "024: 악기", "025: 스포츠용품",
  "026: 서적", "027: 호텔/펜션", "028: 여행패키지", "029: 항공권",
  "030: 렌터카", "031: 물품대여(정수기등)", "032: 물품대여(서적등)",
  "033: 디지털콘텐츠", "034: 상품권/쿠폰", "035: 기타",
  "036: 생활화학제품", "037: 살생물제품",
];

const VALID_CODES = new Set(CATEGORY_CODES.map((c) => c.slice(0, 3)));

const SYSTEM_PROMPT = `You are a logistics data extractor for Korean cross-border e-commerce (source: Germany).
Given a product name (Korean or English), use web search to find the product's typical shipping dimensions and weight, classify it into a 사방넷 category, AND provide a German product name suitable for searching on idealo.de.

Return ONLY a raw JSON object (no markdown, no code fences) with this exact shape:
{
  "productNameEn": "<canonical English product name>",
  "productNameDe": "<German product name optimized for idealo.de search>",
  "weightKg": <number, actual shipping weight in kg, including packaging>,
  "widthMm": <number>,
  "heightMm": <number>,
  "depthMm": <number>,
  "categoryCode": "<3-digit string from the list below, or 035 if none apply>",
  "confidence": "high" | "medium" | "low",
  "note": "<1-sentence explanation>"
}

사방넷 category codes (use EXACTLY these 3-digit codes):
${CATEGORY_CODES.join(", ")}

Rules:
- productNameDe: Keep brand names in original form (Nike, Adidas). Translate product types to German (shoes→Schuhe, bag→Tasche, pants→Hose, etc.). If the product name is already used in Germany (iPhone, Kiehl's), keep it.
- If the product is clearly NOT in categories 001-034, 036, 037 → use "035" (기타).
- Provide realistic PACKAGED shipping dimensions (box size), not bare product size.
- If unsure, estimate conservatively and set confidence to "low".
- Output raw JSON only. No prose, no backticks.`;

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const productName = (body?.productName || "").trim();
  if (!productName || productName.length > 200) {
    return json({ error: "productName required (1~200 chars)" }, 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "Server misconfiguration: ANTHROPIC_API_KEY not set" }, 500);
  }

  let anthropicRes;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Product name: ${productName}` }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });
  } catch (e) {
    return json({ error: `Anthropic API network error: ${e.message}` }, 502);
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return json({ error: `Anthropic API ${anthropicRes.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const data = await anthropicRes.json();
  const fullText = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const cleaned = fullText.replace(/```json\s*|\s*```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    return json({ error: "AI 응답에서 JSON을 찾지 못함", raw: fullText.slice(0, 300) }, 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch (e) {
    return json({ error: `JSON 파싱 실패: ${e.message}` }, 502);
  }

  let code = String(parsed.categoryCode || "").padStart(3, "0");
  if (!VALID_CODES.has(code)) code = "035";

  return json({
    productNameEn: parsed.productNameEn || productName,
    productNameDe: parsed.productNameDe || productName,
    weightKg: Number(parsed.weightKg) || 0,
    widthMm: Number(parsed.widthMm) || 0,
    heightMm: Number(parsed.heightMm) || 0,
    depthMm: Number(parsed.depthMm) || 0,
    categoryCode: code,
    confidence: parsed.confidence || "medium",
    note: parsed.note || "",
  });
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
