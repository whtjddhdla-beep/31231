import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core Master Databases
const CUSTOMER_MASTER = [
  { id: "1", name: "강남 루프탑 바", region: "강남", category: "와인바", revenue: "7,500만", period: 7, lastVisit: "2026-06-10", notes: "고가 와인 선호" },
  { id: "2", name: "을지로 삼겹살 본점", region: "종로", category: "한식", revenue: "4,800만", period: 14, lastVisit: "2026-06-05", notes: "가성비 와인, 단가 민감" },
  { id: "3", name: "여의도 비즈니스 라운지", region: "영등포", category: "비즈니스", revenue: "1억 5,000만", period: 5, lastVisit: "2026-06-14", notes: "법인카드 결제 많음, 프리미엄 선호" }
];

const PRODUCT_MASTER = [
  { name: "A 보르도 레드", category: "프리미엄", cost: 20000, recommendedPrice: 50000, minMargin: 0.60, alternative: "B 이태리 레드" },
  { name: "C 칠레 까쇼", category: "데일리", cost: 8000, recommendedPrice: 25000, minMargin: 0.68, alternative: "D 아르헨티나 말벡" },
  { name: "D 아르헨티나 말벡", category: "데일리", cost: 9000, recommendedPrice: 26000, minMargin: 0.65, alternative: "C 칠레 까쇼" }
];

// Pure Local Fallback Simulator
function simulateLocally(clientName: string, productName: string, discountPercent: number) {
  // Find customer or default to first
  let customer = CUSTOMER_MASTER.find(c => clientName.includes(c.name) || c.name.includes(clientName)) || CUSTOMER_MASTER[0];
  
  // Find product or default to first
  let product = PRODUCT_MASTER.find(p => productName.includes(p.name) || p.name.includes(productName)) || PRODUCT_MASTER[0];

  const discountRate = discountPercent / 100;
  const finalPrice = Math.round(product.recommendedPrice * (1 - discountRate));
  const marginRate = (finalPrice - product.cost) / finalPrice;
  const isWarning = marginRate < product.minMargin;
  const status = isWarning ? "⚠️ 위험(경고)" : "🟢 안정";
  const alternative = product.alternative;

  let script = "";
  if (isWarning) {
    script = `[국순당 서울사업부 업셀링 파트너십 상생 제안]
존경하는 ${customer.name} 대표님 안녕하십니까, 국순당 서울사업부 담당자입니다.
상생 협력을 위해 제안해주신 이번 ${product.name}의 할인 제안은 안타깝게도 마진 보장선 하회로 지속 공급이 어려운 수준입니다.
따라서, 당사는 대표님의 매장 컨셉과 가성비 고객 니즈를 동시에 조율할 수 있는 우수 대체 품목인 '${alternative}'(을)를 우선 제안해 드리고자 합니다. 
대표님 매장과의 돈독한 신뢰를 지켜나가며 함께 윈-윈(Win-Win)할 수 있도록 단가 보조 및 홍보용 한정 프로모션을 적극 기획하여 서포트하겠습니다.`;
  } else {
    script = `[국순당 서울사업부 상생 프로모션 제안]
${customer.name} 대표님 안녕하십니까, 국순당 서울사업부입니다.
전달해주신 특별 프로모션(할인율 ${(discountPercent).toFixed(0)}%)은 마진 안정권 기준을 모두 충족하며, 아주 우수한 경쟁력을 확보하고 있습니다.
대표님의 성공적인 매장 활성화 및 시너지 극대화를 위해 당사 주류 홍보 인쇄물 지원 및 전담 영업 컨설팅을 즉시 배치해 동반 성장을 도모하겠습니다.`;
  }

  // Draw Mobile Gui text based on rule and design theme
  const formattedPrice = finalPrice.toLocaleString();
  const formattedCost = product.cost.toLocaleString();
  const formattedRec = product.recommendedPrice.toLocaleString();
  const formattedMargin = (marginRate * 100).toFixed(1);
  const formattedMinMargin = (product.minMargin * 100).toFixed(0);

  const guiText = `--------------------------------------------------
📱 WineProfit Pro | 국순당 서울 사업부 전용 시뮬레이터
==================================================
[고객 기본 정보]
▶ 고객명  : ${customer.name} (${customer.region})
▶ 업종    : ${customer.category} (평균매출: ${customer.revenue})
▶ 방문주기: ${customer.period}일 (직전방문: ${customer.lastVisit})
▶ 특이사항: ${customer.notes}
--------------------------------------------------
[제안 제품 정보]
▶ 선정 제품: ${product.name} [${product.category}]
▶ 원 가    : ${formattedCost}원 | 권장가: ${formattedRec}원
▶ 최소보증 : ${formattedMinMargin}% 마진율
--------------------------------------------------
[실시간 영업 연산 결과]
▶ 설정 할인율 : ${(discountPercent).toFixed(1)}%
▶ 최종 판매가 : ${formattedPrice}원
▶ 실시간마진율: ${formattedMargin}%
==================================================
판정 결과: [${status}]
${isWarning ? `⚠️ 마진 경고: 대체 상품인 '${alternative}' 제안 필요!` : `🟢 마진 충족: 상생 가이드라인 통과!`}
==================================================
[국순당 톤앤매너 영업 제안 스크립트]
${script}
--------------------------------------------------`;

  return {
    parsed: {
      clientName: customer.name,
      productName: product.name,
      discountRate,
      finalPrice,
      marginRate,
      status: status as '🟢 안정' | '⚠️ 위험(경고)',
      alternative,
      script
    },
    guiText
  };
}

// REST API for Simulation
app.post("/api/simulate", async (req, res) => {
  const { command, clientName, productName, discountRate } = req.body;

  // If we have a prompt/command, prefer Gemini AI
  if (command && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const promptContext = `
넌 국순당 서울 사업부 전용 영업 지원 앱인 'WineProfit Pro'의 스마트 구동 시뮬레이터 엔진이다.
사용자가 한글로 자연스러운 실시간 시뮬레이션 명령이나 요청을 보냈을 때, 이를 분석하고 다음 규칙에 따라 수치 연산과 대시보드 화면을 갱신해라.

[고객관리_마스터]
${JSON.stringify(CUSTOMER_MASTER)}

[제품포트폴리오_마스터]
${JSON.stringify(PRODUCT_MASTER)}

[앱 구동 및 연산 규칙]
1. 최종판매가 = 권장가 * (1 - 할인율)
2. 실시간마진율 = (최종판매가 - 원가) / 최종판매가
3. 상태 판정: 실시간마진율 < 최소보장마진율 이면 [⚠️ 위험(경고)] 상태가 되며, 이 경우 제품 마스터의 '대체재'를 찾아내고 국순당의 톤앤매너(정중함, 상생, 대표님에 대한 예외적인 깍듯함)를 담은 업셀링 제안 스크립트를 화면 하단에 함께 출력한다. 충족하면 [🟢 안정]으로 표시한다.

[출력 화면 UI 가이드라인]
항상 테두리 선(--- 나 ===)을 사용하여 모바일 앱 디스플레이 형태를 유지하고, 국순당 톤앤매너에 맞게 깔끔하고 정중하게 레이아웃을 그려라. 대화형 설명은 배제하고 앱 화면 자체를 묘사하라.

[사용자 입력 명령어]
"${command}"

위 명령어를 가로챈 다음, 관련 있는 고객(대상의 키워드가 포함되거나 문맥상 파악되는 곳)과 제품, 할인 조건을 파악하여 연산해라.
만약 정확한 고객이나 제품이 매칭되지 않는다면, 가장 근접한 것이나 기존 항목 중 첫 번째 항목을 사용하라.
할인율이 명시되지 않았다면 문맥상으로 유추하거나 15% 또는 0%를 기본값으로 사용하라.

출력은 반드시 JSON 형식을 따라야 하며, 스키마는 다음과 같다.
{
  "parsed": {
    "clientName": "매칭된 고객명",
    "productName": "매칭된 제품명",
    "discountRate": 할인율숫자 (예: 15% 일 경우 0.15),
    "finalPrice": 계산된 최종판매가 숫자,
    "marginRate": 계산된 실시간마진율 숫자 (0에서 1 사이),
    "status": "🟢 안정" 또는 "⚠️ 위험(경고)",
    "alternative": "대체재 제품명",
    "script": "고객에게 전달할 우아하고 정중한 국순당 톤앤매너 제안 스크립트"
  },
  "guiText": "테두리선과 정렬 문자로 완벽히 구현한 모바일 디스플레이 텍스트 화면 (반드시 ---와 ===를 사용하여 모바일 디스플레이 형태로 출력)"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptContext,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              parsed: {
                type: Type.OBJECT,
                properties: {
                  clientName: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  discountRate: { type: Type.NUMBER },
                  finalPrice: { type: Type.NUMBER },
                  marginRate: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  alternative: { type: Type.STRING },
                  script: { type: Type.STRING }
                },
                required: ["clientName", "productName", "discountRate", "finalPrice", "marginRate", "status", "alternative", "script"]
              },
              guiText: { type: Type.STRING }
            },
            required: ["parsed", "guiText"]
          }
        }
      });

      const responseText = response.text || "";
      const resultObj = JSON.parse(responseText.trim());
      return res.json(resultObj);

    } catch (e: any) {
      console.error("Gemini invocation failed, falling back locally:", e.message);
      // Fallback
      let client = "강남 루프탑 바";
      let product = "A 보르도 레드";
      let discount = 15;

      // Extract details from command if possible
      CUSTOMER_MASTER.forEach(c => {
        if (command.includes(c.name) || command.includes(c.region)) client = c.name;
      });
      PRODUCT_MASTER.forEach(p => {
        if (command.includes(p.name)) product = p.name;
      });
      const discMatch = command.match(/(\d+)%/);
      if (discMatch) {
         discount = parseInt(discMatch[1], 10);
      }

      const result = simulateLocally(client, product, discount);
      return res.json({
        ...result,
        message: "로컬 엔진을 통해 실시간 연산되었습니다. (API 키 미설정)"
      });
    }
  } else {
    // Normal numeric slide simulator trigger using client, product and discountRate provided
    const targetClient = clientName || "강남 루프탑 바";
    const targetProduct = productName || "A 보르도 레드";
    const targetDiscount = discountRate !== undefined ? Math.round(discountRate * 100) : 15;

    const result = simulateLocally(targetClient, targetProduct, targetDiscount);
    return res.json(result);
  }
});

// Initialize dev-server or prod-server robustly
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("[WineProfit Pro] Dev Server integrated standard Vite middleware.");
    } catch (err: any) {
      console.error("[WineProfit Pro] Failed to load Vite middleware:", err);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WineProfit Pro] App Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
