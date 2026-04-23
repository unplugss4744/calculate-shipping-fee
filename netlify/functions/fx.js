/**
 * /api/fx - EUR/KRW 환율
 *
 * 서버 사이드 호출이라 CORS/sandbox 제약 없음.
 * 30분 메모리 캐시로 API 호출 최소화 (Lambda warm start 기준).
 */

let cache = { rate: null, date: null, source: null, ts: 0 };
const TTL_MS = 30 * 60 * 1000;

const SOURCES = [
  {
    name: "jsdelivr",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
    parse: (j) => ({ rate: j.eur?.krw, date: j.date }),
  },
  {
    name: "er-api",
    url: "https://open.er-api.com/v6/latest/EUR",
    parse: (j) => ({ rate: j.rates?.KRW, date: j.time_last_update_utc?.slice(0, 16) }),
  },
  {
    name: "frankfurter",
    url: "https://api.frankfurter.app/latest?from=EUR&to=KRW",
    parse: (j) => ({ rate: j.rates?.KRW, date: j.date }),
  },
];

export default async () => {
  const now = Date.now();
  if (cache.rate && now - cache.ts < TTL_MS) {
    return json({ ...cache, cached: true });
  }

  const errors = [];
  for (const src of SOURCES) {
    try {
      const r = await fetch(src.url, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) { errors.push(`${src.name}: HTTP ${r.status}`); continue; }
      const j = await r.json();
      const { rate, date } = src.parse(j);
      if (typeof rate !== "number" || isNaN(rate)) {
        errors.push(`${src.name}: 응답 형식 오류`);
        continue;
      }
      cache = { rate, date: date || new Date().toISOString().slice(0, 10), source: src.name, ts: now };
      return json({ ...cache, cached: false });
    } catch (e) {
      errors.push(`${src.name}: ${e.message}`);
    }
  }

  return json({ error: "모든 환율 소스 실패", details: errors }, 502);
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
