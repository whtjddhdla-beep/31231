import React, { useState, useEffect, useRef } from 'react';
import { 
  Wine, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Sparkles, 
  Command, 
  Send, 
  Copy, 
  RotateCcw, 
  FileText, 
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Product, SimulationState } from './types';

// Hardcoded Master data to align with backend
const CUSTOMER_MASTER: Customer[] = [
  { id: "1", name: "강남 루프탑 바", region: "강남", category: "와인바", revenue: "7,500만", period: 7, lastVisit: "2026-06-10", notes: "고가 와인 선호" },
  { id: "2", name: "을지로 삼겹살 본점", region: "종로", category: "한식", revenue: "4,800만", period: 14, lastVisit: "2026-06-05", notes: "가성비 와인, 단가 민감" },
  { id: "3", name: "여의도 비즈니스 라운지", region: "영등포", category: "비즈니스", revenue: "1억 5,000만", period: 5, lastVisit: "2026-06-14", notes: "법인카드 결제 많음, 프리미엄 선호" }
];

const PRODUCT_MASTER: Product[] = [
  { name: "A 보르도 레드", category: "프리미엄", cost: 20000, recommendedPrice: 50000, minMargin: 0.60, alternative: "B 이태리 레드" },
  { name: "C 칠레 까쇼", category: "데일리", cost: 8000, recommendedPrice: 25000, minMargin: 0.68, alternative: "D 아르헨티나 말벡" },
  { name: "D 아르헨티나 말벡", category: "데일리", cost: 9000, recommendedPrice: 26000, minMargin: 0.65, alternative: "C 칠레 까쇼" }
];

export default function App() {
  // Simulator State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(CUSTOMER_MASTER[0]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCT_MASTER[0]);
  const [discountPercent, setDiscountPercent] = useState<number>(15); // slider 0 - 50%
  
  // Interactive command console
  const [commandInput, setCommandInput] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<Array<{role: 'user' | 'system', text: string}>>([
    { role: 'system', text: '국순당 서울사업부 WineProfit Pro 시뮬레이션 엔진 상태: [온라인-안정]' }
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Simulated console render
  const [guiTextOutput, setGuiTextOutput] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Live Calculated state (Computed instantly for lag-free performance)
  const discountRate = discountPercent / 100;
  const finalPrice = Math.round(selectedProduct.recommendedPrice * (1 - discountRate));
  const marginRate = (finalPrice - selectedProduct.cost) / finalPrice;
  const isWarning = marginRate < selectedProduct.minMargin;
  const statusBadge = isWarning ? '⚠️ 위험(경고)' : '🟢 안정';

  // Create local proposal script
  const localProposalScript = isWarning 
    ? `[국순당 서울사업부 업셀링 파트너십 상생 제안]
존경하는 ${selectedCustomer.name} 대표님 안녕하십니까, 국순당 서울사업부 담당자입니다.
상생 협력을 위해 제안해주신 이번 ${selectedProduct.name}의 할인 제안은 안타깝게도 마진 보장선 하회로 지속 공급이 어려운 수준입니다.
따라서 당사는 대표님의 매장 컨셉과 가성비 고객 니즈를 동시에 조율할 수 있는 우수 대체 품목인 '${selectedProduct.alternative}'(을)를 제안드리고자 합니다.
대표님 매장과의 소중한 신뢰 파트너십을 지켜나가며 함께 상생할 수 있도록 본 대체품에 대한 단가 보조 및 프로모션을 전폭적으로 준비하겠습니다.`
    : `[국순당 서울사업부 상생 프로모션 제안]
${selectedCustomer.name} 대표님 안녕하십니까, 국순당 서울사업부입니다.
전달해주신 특별 프로모션(할인율 ${discountPercent}%)은 제품 마진 적합 판정을 통과했습니다.
대표님 매장의 여름 시즌 매출 견인을 위해 테이블 텐트 배포 및 SNS 한정 공동 마케팅 지원을 즉각 개시하겠습니다.`;

  // Draw simulation display text
  const drawGuiText = (cust: Customer, prod: Product, disc: number, statusStr: string, isWarn: boolean) => {
    const fPrice = Math.round(prod.recommendedPrice * (1 - disc / 100));
    const mRate = (fPrice - prod.cost) / fPrice;
    const fPercent = disc.toFixed(1);
    
    return `--------------------------------------------------
📱 WineProfit Pro | 국순당 서울 사업부 전용 시뮬레이터
==================================================
[고객 기본 정보]
▶ 고객명  : ${cust.name} (${cust.region})
▶ 업종    : ${cust.category} (평균매출: ${cust.revenue})
▶ 방문주기: ${cust.period}일 (직전방문: ${cust.lastVisit})
▶ 특이사항: ${cust.notes}
--------------------------------------------------
[제안 제품 정보]
▶ 선정 제품: ${prod.name} [${prod.category}]
▶ 원 가    : ${prod.cost.toLocaleString()}원 | 권장가: ${prod.recommendedPrice.toLocaleString()}원
▶ 최소보증 : ${(prod.minMargin * 100).toFixed(0)}% 마진율
--------------------------------------------------
[실시간 영업 연산 결과]
▶ 설정 할인율 : ${fPercent}%
▶ 최종 판매가 : ${fPrice.toLocaleString()}원
▶ 실시간마진율: ${(mRate * 100).toFixed(1)}%
==================================================
판정 결과: [${statusStr}]
${isWarn ? `⚠️ 마진 경고: 대체 상품인 '${prod.alternative}' 제안 필요!` : `🟢 마진 충족: 상생 가이드라인 통과!`}
==================================================
[국순당 톤앤매너 영업 제안 스크립트]
${isWarn ? `[국순당 서울사업부 업셀링 상생 제안]
존경하는 ${cust.name} 대표님, 본 ${prod.name} 특별 프로모션은 마진 보장 기준치 하회로 안정적 지원이 어렵습니다. 
가성비 대안이자 최상의 마진 성과를 낼 수 있는 전략대안인 '${prod.alternative}'(을)를 우선 제안해 올립니다. 상생 단가 보조와 홍보책을 결합해 함께 상생 협력하겠습니다.` : `[국순당 서울사업부 상생 프로모션 통과]
존경하는 ${cust.name} 대표님, 제안해주신 ${fPercent}% 프로모션 조건은 즉시 통과되었습니다. 여름 시즌 매출 증대를 위한 맞춤 홍보물 지원과 전담 프로모션을 개시합니다.`}
--------------------------------------------------`;
  };

  // Sync internal UI modifications to GUI board output
  useEffect(() => {
    const output = drawGuiText(selectedCustomer, selectedProduct, discountPercent, statusBadge, isWarning);
    setGuiTextOutput(output);
  }, [selectedCustomer, selectedProduct, discountPercent]);

  // Handler for conversational commands
  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const userMsg = commandInput;
    setCommandInput('');
    setCommandHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsSimulating(true);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMsg })
      });

      if (!response.ok) {
        throw new Error('시뮬레이션 서버 연산 응답 지연');
      }

      const data = await response.json();
      
      if (data.parsed) {
        // Sync sliders & selectors
        const matchedCust = CUSTOMER_MASTER.find(c => c.name === data.parsed.clientName) 
          || CUSTOMER_MASTER.find(c => c.name.includes(data.parsed.clientName) || data.parsed.clientName.includes(c.name));
        if (matchedCust) setSelectedCustomer(matchedCust);

        const matchedProd = PRODUCT_MASTER.find(p => p.name === data.parsed.productName)
          || PRODUCT_MASTER.find(p => p.name.includes(data.parsed.productName) || data.parsed.productName.includes(p.name));
        if (matchedProd) setSelectedProduct(matchedProd);

        if (data.parsed.discountRate !== undefined) {
          setDiscountPercent(Math.round(data.parsed.discountRate * 100));
        }

        // Draw response text or set from backend
        if (data.guiText) {
          setGuiTextOutput(data.guiText);
        } else {
          const syncOutput = drawGuiText(
            matchedCust || selectedCustomer,
            matchedProd || selectedProduct,
            data.parsed.discountRate * 100 || discountPercent,
            data.parsed.status || statusBadge,
            (data.parsed.marginRate || marginRate) < (matchedProd || selectedProduct).minMargin
          );
          setGuiTextOutput(syncOutput);
        }

        setCommandHistory(prev => [...prev, { 
          role: 'system', 
          text: `엔진 수신 완료: 고객 '${data.parsed.clientName}' | 제품 '${data.parsed.productName}' | 할인율 ${(data.parsed.discountRate * 100).toFixed(0)}% 반영` 
        }]);
      } else {
        throw new Error('데이터 파싱 오류');
      }

    } catch (err: any) {
      console.warn("API Simulate Error:", err.message);
      
      // Smart offline parsing rule for Korean keywords
      let fallbackClient = selectedCustomer;
      let fallbackProduct = selectedProduct;
      let fallbackDiscount = discountPercent;

      CUSTOMER_MASTER.forEach(c => {
        if (userMsg.includes(c.name) || userMsg.includes(c.region)) fallbackClient = c;
      });
      PRODUCT_MASTER.forEach(p => {
        if (userMsg.includes(p.name) || userMsg.includes(p.name.replace(" 보르도 레드", "")) || userMsg.includes("보르도")) fallbackProduct = p;
        if (userMsg.includes(p.name) || userMsg.includes("칠레") || userMsg.includes("까쇼")) fallbackProduct = PRODUCT_MASTER[1];
        if (userMsg.includes("말벡") || userMsg.includes("아르헨")) fallbackProduct = PRODUCT_MASTER[2];
      });

      const matchedDigits = userMsg.match(/(\d+)%/);
      if (matchedDigits) {
        fallbackDiscount = parseInt(matchedDigits[1], 10);
      }

      setSelectedCustomer(fallbackClient);
      setSelectedProduct(fallbackProduct);
      setDiscountPercent(fallbackDiscount);

      setCommandHistory(prev => [...prev, { 
        role: 'system', 
        text: `로컬 처리 엔진 작동: '${fallbackClient.name}'에 '${fallbackProduct.name}' ${fallbackDiscount}% 기준 갱신 완료` 
      }]);
    } finally {
      setIsSimulating(false);
    }
  };

  // Preset action buttons for testing commands
  const runPresetCommand = (commandText: string) => {
    setCommandInput(commandText);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-900 selection:text-white">
      {/* Top Header Section */}
      <header className="border-b border-rose-950/40 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-900/80 p-2.5 rounded-xl border border-rose-700/50 shadow-inner flex items-center justify-center">
              <Wine className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-rose-900 text-rose-200 border border-rose-800 px-2 py-0.5 rounded-full font-mono uppercase tracking-wide font-medium">Internal</span>
                <span className="text-xs text-amber-500 font-medium">국순당 서울사업부 전용 영업 지원</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight mt-0.5 flex items-center gap-1.5">
                WineProfit Pro <span className="text-sm font-normal text-slate-400 font-mono">v1.5 Premium</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-lg">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
              <span className="font-mono text-slate-300 font-medium">시뮬레이터 상태: 🟢 ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Gorgeous GUI Simulator Controls (Cols 7) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Section Description */}
          <div className="bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900 border border-rose-950/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 font-bold text-7xl text-rose-500 font-mono select-none pointer-events-none -mr-3 -mt-3">
              KSD
            </div>
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-400">국순당 서울사업부 마진 상생 시스템</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  WineProfit Pro는 파트너 점주님들의 매출 진작과 당사 안정적 도매 마진을 균형 있게 시뮬레이션합니다. 
                  할인 적용 후 실시간 마진율이 <strong>최소보장마진율</strong> 이하로 저하되면 즉각 경고를 발신하고 
                  상생 대체제와 제안 서신을 실시간 생산합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Master Block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-200">고객관리 마스터</h2>
              </div>
              <span className="text-xs text-rose-500 font-mono font-medium bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-950/50">DB 연동</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CUSTOMER_MASTER.map((cust) => {
                const isSelected = selectedCustomer.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all relative ${
                      isSelected 
                        ? 'bg-rose-950/30 border-rose-500/80 shadow-md ring-1 ring-rose-500/20' 
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/60'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-rose-500 w-2 h-2 rounded-full"></span>
                    )}
                    <div className="text-xs text-slate-400 font-medium">{cust.region} • {cust.category}</div>
                    <div className="font-bold text-slate-100 text-sm mt-1">{cust.name}</div>
                    <div className="text-xs text-amber-500 font-medium mt-1 font-mono">매출 {cust.revenue}</div>
                    
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-300 leading-normal flex-1 flex flex-col justify-end">
                      <div className="flex justify-between">
                        <span>방문주기</span>
                        <span className="font-mono text-slate-200">{cust.period}일</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>직전방문</span>
                        <span className="font-mono text-slate-200">{cust.lastVisit}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Selected Customer Specific Note Panel */}
            <div className="mt-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs flex justify-between items-center text-slate-400">
              <span className="shrink-0 font-medium text-slate-300">💡 {selectedCustomer.name} 매장 특이사항:</span>
              <span className="text-amber-400 text-right shrink select-none truncate ml-2 font-medium">{selectedCustomer.notes}</span>
            </div>
          </div>

          {/* Product Master Block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wine className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-200">제품 포트폴리오 마스터</h2>
              </div>
              <span className="text-xs text-rose-500 font-mono font-medium bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-950/50">KSD Wine List</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRODUCT_MASTER.map((prod) => {
                const isSelected = selectedProduct.name === prod.name;
                return (
                  <button
                    key={prod.name}
                    onClick={() => setSelectedProduct(prod)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all relative ${
                      isSelected 
                        ? 'bg-rose-950/30 border-rose-500/80 shadow-md ring-1 ring-rose-500/20' 
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/60'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-rose-500 w-2 h-2 rounded-full"></span>
                    )}
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${
                      prod.category === '프리미엄' 
                        ? 'bg-amber-900/50 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {prod.category}
                    </span>
                    <div className="font-bold text-slate-100 text-sm mt-2">{prod.name}</div>
                    
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>원가</span>
                        <span className="font-mono text-slate-200">{prod.cost.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>권장가</span>
                        <span className="font-mono text-slate-200">{prod.recommendedPrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-amber-500 font-medium">
                        <span>보증마진</span>
                        <span className="font-mono">{(prod.minMargin * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Calculator Slide Panel */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-200">실시간 할인율 시뮬레이터</h2>
              </div>
              <div className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
                연산 규칙 : <span className="font-mono text-amber-400">최종가 = 권장가 * (1-할인율)</span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-6">
              {/* Slider Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-300">프로모션 제안 할인율 설정</label>
                  <span className="text-lg font-mono font-bold text-amber-500 bg-amber-950/30 px-3 py-0.5 rounded border border-amber-900/50">
                    {discountPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-rose-600 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                  <span>0% (권장가 그대로 판매)</span>
                  <span>15% (기본값)</span>
                  <span>30% (한계 수위)</span>
                  <span>50% (최대 할인)</span>
                </div>
              </div>

              {/* Dynamic Outcomes Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Result Final Selling Price */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-xs text-slate-400 font-medium">최종 제안 가격(VAT 별도)</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-slate-50">{finalPrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-medium">원</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    권장가 {selectedProduct.recommendedPrice.toLocaleString()}원 대비
                  </div>
                </div>

                {/* Calculated Real-time Margin */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">실시간 대리점 마진율</span>
                    <span className="text-[10px] font-mono text-slate-400">보증선: {(selectedProduct.minMargin * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-2xl font-black font-mono ${marginRate >= selectedProduct.minMargin ? 'text-green-400' : 'text-rose-500'}`}>
                      {(marginRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    원가 {selectedProduct.cost.toLocaleString()}원 제외 순수익전환
                  </div>
                </div>

                {/* Status Evaluation block */}
                <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  !isWarning 
                    ? 'bg-green-950/20 border-green-800/50 text-green-400' 
                    : 'bg-rose-950/20 border-rose-800/50 text-rose-400'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">마진 안전성 검증</span>
                    {!isWarning ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  </div>
                  <div className="mt-1 font-extrabold text-lg flex items-center gap-1">
                    {statusBadge}
                  </div>
                  <div className="text-[10px] mt-1 text-slate-300 font-normal leading-normal">
                    {!isWarning 
                      ? "국순당 상생 마진 권장선을 상회합니다." 
                      : `단가 기준 미만! 대체재 '${selectedProduct.alternative}' 필수 제안.`}
                  </div>
                </div>
              </div>

              {/* Alternative Product recommendation alert card */}
              <AnimatePresence>
                {isWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 flex-1">
                      <div className="font-bold text-amber-400">💡 마진보장선 수호를 위한 우회 업셀링 제안</div>
                      <p className="mt-1 leading-relaxed">
                        현재 제안하신 할인율은 권장 점주 마진을 보장해 드리지 못해 파트너십 상 해가 될 수 있습니다. 
                        국순당 상생 규칙에 따라 대체제로 지정된 <strong className="text-amber-300">'{selectedProduct.alternative}'</strong> 상품 제안을 검토해 주십시오. 
                        수율 구조가 대폭 보강되어 점주 신뢰도를 완벽히 유지할 수 있습니다.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Polite win-win Sales Proposal Script block */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-200">국순당 톤앤매너 상생 제안서 스크립트</h2>
              </div>
              <button
                onClick={() => copyToClipboard(localProposalScript, 'script')}
                className="flex items-center gap-1 text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{copiedNotification === 'script' ? '복사 완료!' : '클리어 전송문 복사'}</span>
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 border border-rose-950/20 max-h-56 overflow-y-auto">
              <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed select-text">
                {localProposalScript}
              </pre>
            </div>
          </div>

        </section>

        {/* Right Hand: Monospace CRT CLI engine simulator (Cols 5) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Smart AI Prompt engine Console */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex-1 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-200">WineProfit Sim Engine CMD</h2>
              </div>
              <span className="text-[10px] font-mono text-green-400 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md">
                Gemini-3.5-Flash
              </span>
            </div>

            {/* Simulated CRT Screen showing Plaintext Mobile GUI display */}
            <div className="flex-1 bg-black p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-auto relative focus-within:ring-2 focus-within:ring-rose-500/20 select-text max-h-[500px]">
              {/* Scanline overlay for CRT effect */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/20 pointer-events-none rounded-xl" />
              
              <div className="relative z-10 text-emerald-400 whitespace-pre scrollbar-thin">
                {guiTextOutput || '시뮬레이터를 초기화 중입니다.'}
              </div>
            </div>

            {/* Quick Testing Command Tags */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-2 font-medium">💡 빠른 엔진 주입 명령어 예제 (클릭 시 세팅):</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "여의도 비즈니스 라운지 A 보르도 레드 20% 특별 프로모션",
                  "을지로 삼겹살 C 칠레 까쇼 35% 단가 할인 타결",
                  "강남 루프탑바 A 보르도 5% 미미 제안"
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => runPresetCommand(preset)}
                    className="text-[10px] text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg transition text-left leading-tight"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Chat Prompt Form */}
            <form onSubmit={handleSendCommand} className="mt-4 pt-3 border-t border-slate-800/80 flex gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="명령어를 입력하세요 (예: 여의도에 칠레 까쇼 15% 제안)"
                disabled={isSimulating}
                className="flex-1 bg-slate-950 text-xs border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSimulating || !commandInput.trim()}
                className="bg-rose-900 hover:bg-rose-800 text-rose-100 disabled:opacity-40 disabled:hover:bg-rose-900 px-4 py-3 rounded-xl border border-rose-800 flex items-center justify-center gap-1.5 font-bold text-xs transition min-w-[80px]"
              >
                {isSimulating ? (
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>전송</span>
                  </>
                )}
              </button>
            </form>

            {/* Console feedback stream */}
            <div className="mt-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-[10px] text-slate-400 font-mono flex items-center justify-between gap-2 max-h-12 overflow-hidden">
              <span className="truncate">📡 {commandHistory[commandHistory.length - 1].text}</span>
              <button 
                type="button"
                onClick={() => setCommandHistory([{ role: 'system', text: '국순당 서울사업부 WineProfit Pro 시뮬레이션 엔진 상태: [온라인-안정]' }])}
                className="hover:text-amber-500 transition cursor-pointer"
                title="로그 초기화"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

        </section>

      </main>

      {/* Corporate footer */}
      <footer className="border-t border-rose-950/40 bg-slate-900/20 py-4 px-6 text-center text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>COOPERATIVE PARTNERSHIP SYSTEM WITH KOOKSOONDANG SEOUL DIVISION</span>
          <span>© 2026 WineProfit Pro Ltd. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
