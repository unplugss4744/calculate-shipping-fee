# 판매가 및 운송비 계산기 (사방넷 속성 자동 매칭)

상품명 입력 → Claude AI가 치수·무게·독일어명을 웹 검색으로 도출 → idealo.de 3번째 최저가 입력 → **네이버(5%)·롯데(23%) 판매가**와 **사방넷 분류코드**를 자동 산출하는 웹앱.

---

## 🎯 기능

- **AI 상품 정보 추출**: 치수(W×H×D mm), 실중량, 독일어 상품명
- **실시간 환율** (3-source fallback: jsdelivr · er-api · frankfurter)
- **운송비 자동 계산**: max(실중량, 부피중량) × 2.5€/kg + 3.1€ 통관비
- **idealo.de 검색 링크** 제공 (독일어 상품명으로 자동 URL 생성)
- **판매가 역산** (본전가, 백원 단위 절상)
  - 네이버 = 구매원가 ÷ 0.95
  - 롯데 = 구매원가 ÷ 0.77
- **사방넷 정보고시 분류코드** 자동 매칭 (001~037) + "N번 항목까지 입력" 안내

---

## 🚀 배포 가이드

> 소요 약 15분. GitHub · Netlify · Anthropic 계정만 있으면 OK

### ① Anthropic API 키 발급

1. https://console.anthropic.com 가입/로그인
2. **Settings → API Keys → Create Key**
3. `sk-ant-...` 키 복사 (창 닫으면 못 봄 — 반드시 저장)
4. **Billing** 에서 결제수단 등록 + 최소 $5 충전
   - Sonnet 4 + web_search 1회 검색당 약 $0.02~0.05
5. **Billing → Spend limits** 월 한도 설정 권장 (예: $20)

### ② GitHub 저장소 업로드

**방법 A (웹 업로드 — 초보자):**
1. https://github.com/new → 저장소 생성 (Private 추천)
2. "uploading an existing file" → 이 zip 내용 전체 드래그앤드롭
3. **Commit changes**

**방법 B (Git CLI):**
```bash
cd shipping-app
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<본인>/shipping-calculator.git
git push -u origin main
```

### ③ Netlify 연결

1. https://app.netlify.com → GitHub로 가입
2. **Add new site → Import an existing project → Deploy with GitHub**
3. 방금 만든 저장소 선택
4. 빌드 설정은 `netlify.toml` 로 자동 감지됨 → **Deploy site**

### ④ ⚠️ 환경변수 등록 (가장 중요)

1. 사이트 대시보드 → **Site configuration → Environment variables**
2. **Add a variable**:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (①에서 복사한 값)
3. **Deploys → Trigger deploy → Deploy site** (재배포 필수)

### ⑤ 동작 확인

배포 URL 접속 → 환율 표시 확인 → `Nike Air Max 270` 검색 → 독일어명 뜨면 idealo 버튼 클릭 → 가격 입력 → 판매가 표시 ✅

---

## 🧪 로컬 개발

```bash
npm install -g netlify-cli  # 최초 1회
npm install
cp .env.example .env         # ANTHROPIC_API_KEY 값 입력
netlify dev                  # http://localhost:8888
```

`git push`하면 Netlify가 자동 재배포합니다.

---

## 🔒 보안 & 비용 관리

### 악의적 사용 방지 (선택)
| 방법 | 구현 |
|---|---|
| 사이트 자체 비밀번호 | Netlify **Password protection** (Pro 플랜) |
| Referer 체크 | `netlify/functions/product.js`에 origin 검증 추가 |
| 공유 토큰 | 쿼리 파라미터로 secret 받기 |
| API 월 한도 | Anthropic Console → **Spend limits** |

### 비용 모니터링
- Anthropic Console → **Usage** 탭에서 일별 사용량 확인

---

## 📁 프로젝트 구조

```
shipping-app/
├── src/
│   ├── App.jsx          # UI (React)
│   ├── main.jsx
│   └── index.css
├── netlify/
│   └── functions/
│       ├── product.js   # Anthropic API 프록시 + 독일어명 반환
│       └── fx.js        # 환율 프록시 (3-source fallback + 30분 캐시)
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml         # Netlify 빌드/라우팅 설정
├── .gitignore
├── .env.example
└── README.md
```

---

## 🧮 핵심 공식

```
부피중량(kg) = W(cm) × H(cm) × D(cm) ÷ 6000
적용중량(kg) = max(실중량, 부피중량)
운송비(€)    = 적용중량 × 2.5€/kg + 3.1€
구매원가(₩)  = idealo 가격(€) × 환율 + 운송비(€) × 환율
판매가(₩)    = Math.ceil(구매원가 ÷ (1 − 수수료율) ÷ 100) × 100
             ├ 네이버 수수료율 5%  → ÷ 0.95
             └ 롯데 수수료율  23% → ÷ 0.77
```

사방넷 분류코드: 001~037 중 매칭 (035 = 기타 fallback)

---

## 🛠 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 환율 안 뜸 | 환경변수 등록 후 **재배포 안 함** | Trigger deploy 다시 |
| "Server misconfiguration" | 환경변수 이름 오타 | 정확히 `ANTHROPIC_API_KEY` |
| "Anthropic API 401" | 키 만료/오류 | 새 키 발급 후 갱신 |
| 빌드 실패 (Node 버전) | Node 18 미만 | 환경변수에 `NODE_VERSION=18` 추가 |
