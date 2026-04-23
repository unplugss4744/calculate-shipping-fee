import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plane, Package, Image as ImageIcon, AlertCircle, Loader2, RefreshCw, Copy, Check, ExternalLink, Tag, Store } from "lucide-react";

/* =======================================================================
 * 사방넷 분류 테이블 (001~037)
 * 클라이언트: 분류명/maxAttr 표시 + 035 보정용 로컬 키워드 매칭
 * ======================================================================= */
const CATEGORIES = {
  "001": { name: "의류", maxAttr: 14, keywords: ["의류","옷","티셔츠","셔츠","자켓","재킷","팬츠","바지","스커트","원피스","니트","후드","코트","청바지","레깅스","양말","속옷","잠옷","shirt","pants","jacket","dress","skirt","coat","hoodie","sweater","jeans"] },
  "002": { name: "구두/신발", maxAttr: 16, keywords: ["신발","구두","스니커즈","운동화","샌들","부츠","로퍼","슬리퍼","힐","플랫","shoes","sneakers","boots","sandals","loafer","heels","slippers"] },
  "003": { name: "가방", maxAttr: 13, keywords: ["가방","백팩","토트","크로스백","클러치","지갑","숄더백","에코백","bag","backpack","tote","wallet","handbag","clutch"] },
  "004": { name: "패션잡화", maxAttr: 15, keywords: ["모자","벨트","액세서리","귀걸이","목걸이","반지","팔찌","스카프","장갑","넥타이","선글라스","안경","hat","cap","belt","scarf","gloves","tie","sunglasses","accessory"] },
  "005": { name: "침구류/커튼", maxAttr: 20, keywords: ["침구","이불","베개","커튼","매트리스","시트","담요","쿠션","blanket","pillow","curtain","bedding","mattress"] },
  "006": { name: "가구", maxAttr: 23, keywords: ["가구","침대","소파","싱크대","책상","의자","테이블","책장","옷장","서랍","furniture","bed","sofa","desk","chair","table","shelf"] },
  "007": { name: "영상가전", maxAttr: 16, keywords: ["tv","텔레비전","모니터","프로젝터","빔프로젝터","television","display"] },
  "008": { name: "가정용 전기제품", maxAttr: 19, keywords: ["냉장고","세탁기","식기세척기","전자레인지","건조기","청소기","refrigerator","washer","microwave","dishwasher","dryer","vacuum"] },
  "009": { name: "계절가전", maxAttr: 19, keywords: ["에어컨","온풍기","선풍기","히터","제습기","가습기","공기청정기","air conditioner","fan","heater","humidifier","purifier"] },
  "010": { name: "사무용기기", maxAttr: 16, keywords: ["컴퓨터","노트북","프린터","스캐너","복합기","마우스","키보드","computer","laptop","printer","scanner","keyboard","mouse"] },
  "011": { name: "광학기기", maxAttr: 14, keywords: ["카메라","캠코더","렌즈","망원경","현미경","쌍안경","camera","camcorder","lens","telescope"] },
  "012": { name: "소형전자", maxAttr: 14, keywords: ["mp3","전자사전","이어폰","헤드폰","블루투스","스피커","충전기","보조배터리","earphone","headphone","speaker","charger","powerbank"] },
  "013": { name: "휴대폰", maxAttr: 17, keywords: ["휴대폰","스마트폰","핸드폰","아이폰","갤럭시","phone","smartphone","iphone","galaxy"] },
  "014": { name: "내비게이션", maxAttr: 15, keywords: ["내비게이션","내비","gps","navigation","navigator"] },
  "015": { name: "자동차용품", maxAttr: 22, keywords: ["자동차","자동차용품","타이어","블랙박스","와이퍼","엔진오일","car","vehicle","tire","dashcam"] },
  "016": { name: "의료기기", maxAttr: 20, keywords: ["의료기기","혈압계","체온계","혈당계","마사지기","찜질기","medical","thermometer"] },
  "017": { name: "주방용품", maxAttr: 25, keywords: ["주방","냄비","프라이팬","도마","식칼","접시","컵","그릇","텀블러","수저","포크","kitchen","pot","pan","plate","cup","bowl","tumbler","fork","knife"] },
  "018": { name: "화장품", maxAttr: 26, keywords: ["화장품","스킨","로션","크림","세럼","에센스","립","립스틱","파운데이션","마스카라","아이라이너","향수","샴푸","바디워시","cosmetic","lotion","cream","serum","lipstick","perfume","shampoo","foundation","mascara"] },
  "019": { name: "귀금속/보석/시계류", maxAttr: 16, keywords: ["시계","손목시계","귀금속","보석","다이아","금","은","watch","jewelry","ring","diamond","gold","silver"] },
  "020": { name: "농수축산물", maxAttr: 28, keywords: ["농산물","수산물","축산물","쌀","과일","채소","고기","생선","fruit","vegetable","meat","fish","rice","grain"] },
  "021": { name: "가공식품", maxAttr: 33, keywords: ["가공식품","과자","라면","초콜릿","커피","원두","차","티","소스","오일","간식","스낵","coffee","tea","snack","chocolate","sauce","oil","noodle","pasta"] },
  "022": { name: "건강기능식품", maxAttr: 26, keywords: ["건강기능식품","영양제","비타민","오메가","프로틴","supplement","vitamin","omega","protein","probiotics"] },
  "023": { name: "어린이제품", maxAttr: 28, keywords: ["어린이","아동","유아","아기","장난감","완구","유모차","카시트","젖병","kid","child","baby","toy","stroller","carseat"] },
  "024": { name: "악기", maxAttr: 13, keywords: ["악기","기타","피아노","드럼","바이올린","우쿨렐레","instrument","guitar","piano","drum","violin","ukulele"] },
  "025": { name: "스포츠용품", maxAttr: 17, keywords: ["스포츠","운동기구","요가","덤벨","러닝","골프","테니스","축구","농구","야구","자전거","등산","sports","yoga","golf","tennis","soccer","basketball","bicycle"] },
  "026": { name: "서적", maxAttr: 11, keywords: ["책","도서","서적","잡지","만화","book","magazine","comic"] },
  "027": { name: "호텔/펜션 예약", maxAttr: 8, keywords: ["호텔","펜션","숙박","예약","hotel","pension","reservation","booking"] },
  "028": { name: "여행패키지", maxAttr: 11, keywords: ["여행","패키지","투어","travel","package","tour"] },
  "029": { name: "항공권", maxAttr: 9, keywords: ["항공권","비행기표","flight","airline ticket"] },
  "030": { name: "자동차 대여 서비스(렌터카)", maxAttr: 9, keywords: ["렌터카","차량대여","rental car","rent-a-car"] },
  "031": { name: "물품대여(정수기/비데/공기청정기)", maxAttr: 15, keywords: ["정수기","비데","공기청정기 대여","water purifier","bidet"] },
  "032": { name: "물품대여(서적/유아용품/행사용품)", maxAttr: 7, keywords: ["서적대여","유아용품대여","행사용품","event rental"] },
  "033": { name: "디지털 콘텐츠", maxAttr: 15, keywords: ["음원","게임","인터넷강의","디지털콘텐츠","ebook","game","digital content"] },
  "034": { name: "상품권/쿠폰", maxAttr: 11, keywords: ["상품권","쿠폰","기프트카드","voucher","coupon","gift card"] },
  "035": { name: "기타", maxAttr: 33, keywords: [] },
  "036": { name: "생활화학제품", maxAttr: 12, keywords: ["세제","섬유유연제","표백제","탈취제","방향제","락스","detergent","softener","bleach","deodorizer"] },
  "037": { name: "살생물제품", maxAttr: 12, keywords: ["살균제","방역","해충","살충제","모기약","disinfectant","insecticide","pesticide"] },
};

/* =======================================================================
 * 계산 상수 & 순수 함수
 * ======================================================================= */
const PER_KG_EUR = 2.5;
const CUSTOMS_FEE_EUR = 3.1;
const VOL_DIVISOR = 6000;
const FEE_NAVER = 0.05;
const FEE_LOTTE = 0.23;

function calcShipping({ weightKg, widthMm, heightMm, depthMm, eurKrw }) {
  const w = widthMm / 10, h = heightMm / 10, d = depthMm / 10;
  const volWeight = (w * h * d) / VOL_DIVISOR;
  const applied = Math.max(weightKg, volWeight);
  const costEur = applied * PER_KG_EUR + CUSTOMS_FEE_EUR;
  const costKrw = Math.round(costEur * eurKrw);
  return { volWeight, applied, costEur, costKrw };
}

/** 판매가 역산: 판매가 × (1 - 수수료율) = 구매원가
 *  판매가는 백원 단위 절상(올림) — 본전가 이상이 되도록 보정 */
function calcSellingPrices({ shippingKrw, idealoEur, eurKrw }) {
  const idealoKrw = Math.round((Number(idealoEur) || 0) * eurKrw);
  const purchaseCostKrw = shippingKrw + idealoKrw;
  const naverKrw = Math.ceil(purchaseCostKrw / (1 - FEE_NAVER) / 100) * 100;
  const lotteKrw = Math.ceil(purchaseCostKrw / (1 - FEE_LOTTE) / 100) * 100;
  return { idealoKrw, purchaseCostKrw, naverKrw, lotteKrw };
}

function localCategoryMatch(productName) {
  const name = productName.toLowerCase();
  for (const [code, info] of Object.entries(CATEGORIES)) {
    if (code === "035") continue;
    for (const kw of info.keywords) {
      if (name.includes(kw.toLowerCase())) return { code, name: info.name, maxAttr: info.maxAttr };
    }
  }
  return { code: "035", name: "기타", maxAttr: 33 };
}

/* =======================================================================
 * 서버 프록시 호출 — API 키는 서버(Netlify Functions)에만 존재
 * ======================================================================= */
async function fetchProductInfo(productName) {
  const res = await fetch("/api/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productName }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: "Unknown server error" }));
    throw new Error(errBody.error || `Server ${res.status}`);
  }
  return res.json();
}

async function fetchEurKrw() {
  const res = await fetch("/api/fx");
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: "FX fetch failed" }));
    throw new Error(errBody.error || `Server ${res.status}`);
  }
  return res.json();
}

/* =======================================================================
 * UI
 * ======================================================================= */
export default function App() {
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [fx, setFx] = useState({ rate: null, date: null, source: null, loading: true, error: "" });
  const [manualRate, setManualRate] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const [idealoPriceEur, setIdealoPriceEur] = useState("");

  const loadFx = useCallback(async () => {
    setFx((s) => ({ ...s, loading: true, error: "" }));
    try {
      const { rate, date, source } = await fetchEurKrw();
      setFx({ rate, date, source, loading: false, error: "" });
      setShowManual(false);
    } catch (e) {
      setFx((s) => ({ ...s, loading: false, error: e.message }));
      setShowManual(true);
    }
  }, []);

  useEffect(() => { loadFx(); }, [loadFx]);

  function applyManualRate() {
    const n = parseFloat(manualRate.replace(/,/g, ""));
    if (isNaN(n) || n <= 0) { setError("올바른 환율 숫자를 입력하세요."); return; }
    setFx({ rate: n, date: new Date().toISOString().slice(0, 10) + " (수동)", source: "manual", loading: false, error: "" });
    setShowManual(false);
    setError("");
  }

  async function handleSearch() {
    if (!productName.trim()) return;
    if (!fx.rate) { setError("환율이 아직 로드되지 않았습니다."); return; }
    setLoading(true); setError(""); setResult(null); setIdealoPriceEur("");
    try {
      const info = await fetchProductInfo(productName.trim());
      const ship = calcShipping({
        weightKg: info.weightKg, widthMm: info.widthMm, heightMm: info.heightMm, depthMm: info.depthMm,
        eurKrw: fx.rate,
      });
      let finalCode = info.categoryCode;
      if (finalCode === "035") {
        const local = localCategoryMatch(productName);
        if (local.code !== "035") finalCode = local.code;
      }
      const cat = CATEGORIES[finalCode] || CATEGORIES["035"];
      setResult({ ...info, ...ship, categoryCode: finalCode, categoryName: cat.name, maxAttr: cat.maxAttr });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const pricing = useMemo(() => {
    if (!result || !fx.rate) return null;
    const v = parseFloat(String(idealoPriceEur).replace(/,/g, ""));
    if (isNaN(v) || v <= 0) return null;
    return calcSellingPrices({ shippingKrw: result.costKrw, idealoEur: v, eurKrw: fx.rate });
  }, [result, idealoPriceEur, fx.rate]);

  function handleCopy() {
    if (!result) return;
    const lines = [
      `상품명: ${result.productNameEn}`,
      `독일어명: ${result.productNameDe}`,
      `실중량: ${result.weightKg} kg · 치수: ${result.widthMm}×${result.heightMm}×${result.depthMm} mm`,
      `운송비: ₩${result.costKrw.toLocaleString()}`,
    ];
    if (pricing) {
      lines.push(
        `idealo 가격: €${Number(idealoPriceEur)} (₩${pricing.idealoKrw.toLocaleString()})`,
        `구매원가: ₩${pricing.purchaseCostKrw.toLocaleString()}`,
        `네이버 판매가 (수수료 5%): ₩${pricing.naverKrw.toLocaleString()}`,
        `롯데 판매가 (수수료 23%): ₩${pricing.lotteKrw.toLocaleString()}`
      );
    }
    lines.push(
      `사방넷 분류코드: ${result.categoryCode} (${result.categoryName})`,
      `속성 입력 안내: ${result.maxAttr}번 항목까지 입력`
    );
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const googleImgUrl = productName.trim() ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(productName.trim())}` : "";
  const idealoUrl = result?.productNameDe
    ? `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${encodeURIComponent(result.productNameDe)}`
    : "";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-stone-900 text-amber-50 flex items-center justify-center rounded-sm">
              <Tag size={20} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">판매가 및 운송비 계산기</h1>
          </div>
          <p className="text-stone-600 text-sm">상품명 입력 → AI가 치수·무게·독일어명 도출 → idealo 최저가 입력 → 네이버·롯데 판매가 & 사방넷 속성 자동 산출</p>
        </header>

        <div className="bg-white border border-stone-200 p-4 rounded-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">EUR/KRW 실시간 환율</div>
              {fx.loading ? (
                <div className="text-stone-400 flex items-center gap-2 text-sm"><Loader2 size={14} className="animate-spin" /> 로드 중...</div>
              ) : fx.error && !fx.rate ? (
                <div className="text-red-600 text-sm">
                  <div className="font-semibold mb-0.5">자동 환율 로드 실패</div>
                  <div className="text-xs font-mono text-red-500">{fx.error}</div>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  ₩ {Number(fx.rate).toLocaleString()}
                  <span className="text-xs font-normal text-stone-400 ml-2">({fx.date} · {fx.source})</span>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowManual((s) => !s)} className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 border border-stone-200 rounded-sm">수동</button>
              <button onClick={loadFx} className="text-stone-500 hover:text-stone-900 p-2"><RefreshCw size={16} /></button>
            </div>
          </div>
          {showManual && (
            <div className="mt-3 pt-3 border-t border-stone-200 flex gap-2 items-center">
              <span className="text-xs text-stone-600">1 EUR =</span>
              <input type="text" value={manualRate} onChange={(e) => setManualRate(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyManualRate()} placeholder="예: 1520" className="flex-1 px-3 py-1.5 border border-stone-300 rounded-sm text-sm" />
              <span className="text-xs text-stone-600">KRW</span>
              <button onClick={applyManualRate} className="px-3 py-1.5 bg-stone-900 text-amber-50 text-xs font-semibold rounded-sm">적용</button>
            </div>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-sm p-6 mb-6">
          <label className="block text-sm font-semibold mb-2">상품명 (한글 또는 영문)</label>
          <div className="flex gap-2">
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()} placeholder="예: Nike Air Max 270 / 르쿠르제 스튜가드 24cm" className="flex-1 px-4 py-3 border border-stone-300 rounded-sm focus:outline-none focus:border-stone-900 text-base" />
            <button onClick={handleSearch} disabled={loading || !productName.trim()} className="px-6 py-3 bg-stone-900 text-amber-50 font-semibold rounded-sm hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? "검색 중..." : "검색"}
            </button>
          </div>
          {productName.trim() && (
            <a href={googleImgUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2">
              <ImageIcon size={12} /> 구글 이미지로 이 상품 미리 확인
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-sm mb-6 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {result && (
          <div className="bg-white border border-stone-200 rounded-sm overflow-hidden">
            <div className="bg-stone-900 text-amber-50 px-6 py-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs opacity-60 uppercase tracking-wider">검색 결과</div>
                <div className="font-bold text-lg truncate">{result.productNameEn}</div>
              </div>
              <button onClick={handleCopy} className="text-sm bg-amber-50/10 hover:bg-amber-50/20 px-3 py-1.5 rounded-sm flex items-center gap-1.5 shrink-0 ml-2">
                {copied ? <><Check size={14}/> 복사됨</> : <><Copy size={14}/> 전체 복사</>}
              </button>
            </div>

            <div className="p-6 border-b border-stone-200">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Package size={12}/> AI 추정 제품 정보
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                  result.confidence === "high" ? "bg-green-100 text-green-700" :
                  result.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"}`}>신뢰도: {result.confidence}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoCell label="실중량" value={`${result.weightKg} kg`} />
                <InfoCell label="치수 (W×H×D)" value={`${result.widthMm}×${result.heightMm}×${result.depthMm} mm`} />
              </div>
              {result.note && <div className="mt-3 text-xs text-stone-500 italic">※ {result.note}</div>}
            </div>

            <div className="p-6 border-b border-stone-200 bg-stone-50/50">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Plane size={12}/> 운송비 계산
              </div>
              <div className="space-y-1 text-sm font-mono">
                <CalcRow label="부피중량" value={`${result.volWeight.toFixed(2)} kg`} detail="(W×H×D cm ÷ 6000)" />
                <CalcRow label="실중량" value={`${result.weightKg.toFixed(2)} kg`} />
                <CalcRow label="적용중량 (max)" value={`${result.applied.toFixed(2)} kg`} highlight />
                <div className="border-t border-stone-300 my-2"></div>
                <CalcRow label={`× ${PER_KG_EUR}€/kg + ${CUSTOMS_FEE_EUR}€ 통관비`} value={`€${result.costEur.toFixed(2)}`} />
                <CalcRow label={`× ${Number(fx.rate).toLocaleString()} KRW/EUR`} value={`₩${result.costKrw.toLocaleString()}`} big />
              </div>
            </div>

            <div className="p-6 border-b border-stone-200">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-3">🇩🇪 idealo.de 최저가 조회</div>

              <div className="mb-3">
                <div className="text-xs text-stone-500 mb-1">독일어 상품명 (idealo 검색용)</div>
                <div className="bg-stone-100 border border-stone-200 rounded-sm px-3 py-2 font-mono text-sm font-semibold text-stone-800">
                  {result.productNameDe}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 text-sm text-amber-900 mb-3">
                <div className="font-semibold mb-1">📋 단계</div>
                <ol className="list-decimal list-inside space-y-0.5 text-xs leading-relaxed">
                  <li>아래 버튼으로 idealo.de에서 해당 상품명을 검색해 주세요</li>
                  <li>검색 결과 중 <b>3번째 최저가</b>를 아래 입력란에 넣어 주세요</li>
                </ol>
              </div>

              <a href={idealoUrl} target="_blank" rel="noreferrer"
                className="block w-full text-center bg-white border-2 border-stone-900 hover:bg-stone-900 hover:text-amber-50 py-3 rounded-sm transition text-sm font-semibold mb-3">
                <ExternalLink size={14} className="inline mr-1.5 -mt-0.5" />
                idealo.de에서 검색하기 ↗
              </a>

              <div>
                <label className="block text-xs text-stone-600 mb-1">idealo.de 3번째 최저가 (EUR)</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-stone-400">€</span>
                  <input
                    type="text"
                    value={idealoPriceEur}
                    onChange={(e) => setIdealoPriceEur(e.target.value)}
                    placeholder="예: 89.90"
                    className="flex-1 px-3 py-2 border-2 border-stone-300 focus:border-stone-900 rounded-sm text-base font-mono focus:outline-none"
                  />
                  {pricing && (
                    <span className="text-sm text-stone-500 font-mono shrink-0">
                      ≈ ₩{pricing.idealoKrw.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {pricing ? (
              <div className="p-6 border-b border-stone-200 bg-gradient-to-br from-amber-50/40 to-white">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Store size={12}/> 판매가 산출 (수수료 역산)
                </div>

                <div className="bg-white border border-stone-200 rounded-sm p-3 mb-3">
                  <div className="text-xs text-stone-500 mb-1">구매원가 = idealo 가격 + 운송비</div>
                  <div className="flex items-baseline justify-between">
                    <div className="font-mono text-xs text-stone-500">
                      ₩{pricing.idealoKrw.toLocaleString()} + ₩{result.costKrw.toLocaleString()}
                    </div>
                    <div className="font-bold text-xl text-stone-900">₩{pricing.purchaseCostKrw.toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PriceCard platform="네이버" feePct={5} priceKrw={pricing.naverKrw} color="green" />
                  <PriceCard platform="롯데" feePct={23} priceKrw={pricing.lotteKrw} color="red" />
                </div>

                <div className="mt-3 text-[11px] text-stone-500 font-mono leading-relaxed">
                  판매가 × (1 − 수수료율) = 구매원가 가 되도록 역산 후 <b>백원 단위 절상</b>. 본전가 이상을 보장합니다.
                </div>
              </div>
            ) : (
              <div className="p-6 border-b border-stone-200 bg-stone-50/30 text-center text-sm text-stone-400">
                ↑ idealo 가격을 입력하면 네이버/롯데 판매가가 자동 계산됩니다
              </div>
            )}

            <div className="p-6">
              <div className="text-xs text-stone-500 uppercase tracking-wider mb-3">사방넷 정보고시 속성</div>
              <div className="flex items-center gap-4">
                <div className="bg-stone-900 text-amber-50 px-4 py-3 rounded-sm">
                  <div className="text-[10px] opacity-60 uppercase">분류코드</div>
                  <div className="font-mono font-bold text-2xl tracking-wider">{result.categoryCode}</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base mb-0.5">{result.categoryName}</div>
                  <div className="text-sm text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded-sm font-semibold">
                    → {result.maxAttr}번 항목까지 입력
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <a href={googleImgUrl} target="_blank" rel="noreferrer" className="block w-full text-center border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-amber-50 py-3 rounded-sm transition text-sm font-semibold">
                <ImageIcon size={14} className="inline mr-1.5 -mt-0.5" />
                구글 이미지에서 이 상품 사진 확인하기 ↗
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 text-[11px] text-stone-400 font-mono leading-relaxed">
          운송비 = max(실중량, W×H×D/6000) × 2.5€ + 3.1€ · 구매원가 = idealo + 운송비 · 판매가 = 구매원가 ÷ (1−수수료), 백원 절상
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div>
      <div className="text-xs text-stone-500">{label}</div>
      <div className="font-semibold text-base font-mono">{value}</div>
    </div>
  );
}

function CalcRow({ label, value, detail, highlight, big }) {
  return (
    <div className={`flex items-baseline justify-between ${highlight ? "font-bold text-stone-900" : "text-stone-700"}`}>
      <div className="flex-1">
        {label}
        {detail && <span className="text-stone-400 ml-2 text-xs">{detail}</span>}
      </div>
      <div className={`${big ? "text-xl font-bold text-stone-900" : ""}`}>{value}</div>
    </div>
  );
}

function PriceCard({ platform, feePct, priceKrw, color }) {
  const styles = color === "green" ? "border-green-300 bg-green-50" : "border-rose-300 bg-rose-50";
  const badge = color === "green" ? "bg-green-600 text-white" : "bg-rose-600 text-white";
  return (
    <div className={`border-2 ${styles} rounded-sm p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-sm text-stone-800">{platform}</div>
        <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${badge}`}>수수료 {feePct}%</div>
      </div>
      <div className="font-mono font-bold text-2xl text-stone-900">₩{priceKrw.toLocaleString()}</div>
    </div>
  );
}
