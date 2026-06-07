

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  ShieldCheck, 
  HelpCircle, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  FileText,
  Clock,
  ChevronDown,
  Info
} from 'lucide-react';
import Logo from './Logo';
import { PLANS } from '../supabaseMock';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface HomeProps {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'admin', payload?: any) => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Home({ onNavigate, currentLanguage, onLanguageChange }: HomeProps) {
  // Calculator state
  const [calcPlanId, setCalcPlanId] = useState<'regular' | 'gold' | 'titanium' | 'platinum'>('regular');
  const [calcDays, setCalcDays] = useState<number>(30);
  
  // Testimonials state
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto detect user location / language prefix on load is handled by state
  useEffect(() => {
    // Optional basic auto-detection
    const browserLang = navigator.language?.substring(0, 2);
    if (['en', 'fr', 'es', 'pt', 'ar'].includes(browserLang)) {
      // Intentionally load if user hasn't explicitly set it
      if (!localStorage.getItem('lg_lang')) {
        onLanguageChange(browserLang as Language);
      }
    }
  }, [onLanguageChange]);

  const t = (key: string) => {
    return TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  const isRTL = currentLanguage === 'ar';

  const calculateEarnings = () => {
    const selectedPlan = PLANS[calcPlanId];
    // Earnings pause on Saturdays and Sundays (5/7 days are weekdays)
    // We calculate active weekdays in the provided period of days
    let weekdays = 0;
    for (let i = 0; i < calcDays; i++) {
      weekdays++; // standard test weekdays simulation: 5 days every week
    }
    const weekdayRatio = 5 / 7;
    const activeWeekdays = Math.floor(calcDays * weekdayRatio);
    const totalEarnings = activeWeekdays * selectedPlan.dailyEarning;
    const meetsTarget = totalEarnings >= selectedPlan.price;
    return {
      activeWeekdays,
      earnings: totalEarnings,
      unlocked: meetsTarget
    };
  };

  const calcResults = calculateEarnings();

  const testimonials = [
    {
      name: 'Elena Rostova',
      role: 'Private Portfolio Supervisor',
      country: 'Austria',
      quote: 'LeadsGlobal is the absolute sovereign standard of capital accumulation. The $8/day Platinum yields are consistently reliable and automated. Simple payment confirmations make this an unmatched system.',
      plan: 'Platinum Plan ($240)'
    },
    {
      name: 'Jean-Marc Duvall',
      role: 'Investment Analyst',
      country: 'France',
      quote: 'Croissance du Capital is real! I purchased the Gold Plan and upgraded to Titanium. Multi-level referral matches build an incredibly powerful secondary stream of compounding wealth.',
      plan: 'Titanium Plan ($120)'
    },
    {
      name: 'Mateo Castillo',
      role: 'Fintech Entrepreneur',
      country: 'Chile',
      quote: 'Excelente plataforma! Custom ID verification and corporate security protocols like magic links give us full confidence. Unprecedented transparency with the automatic receipts system.',
      plan: 'Gold Plan ($60)'
    }
  ];

  const faqs = [
    {
      q: 'How does LeadsGlobal grow my investment capital?',
      a: 'We leverage combined index funds, real estate arbitrage, and high-frequency liquidity pools. Investors select a defined plan (from $30 up to $240) and receive automated daily yields calculated with pristine precision.'
    },
    {
      q: 'Why are earnings paused on Saturday and Sunday?',
      a: 'Our associated commercial bank transfer queues, equity markets, and physical liquidity networks operate strictly during official commercial hours (Monday to Friday). The platform automatically pauses return generation on weekends to reflect native market logic.'
    },
    {
      q: 'When do withdrawals become active for my account?',
      a: 'To guarantee systemic liquidity and protect active pools, capital withdrawals become fully executable once your accumulated plan returns equal the originally invested amount. Upon meeting this target, your withdrawal triggers instantly after KYC verification approval.'
    },
    {
      q: 'Why is there a $15 KYC processing and validation fee?',
      a: 'The processing fee is routed to professional third-party compliance brokers who carry out strict international AML validation, file verification, and secure state reporting. This is paid once and unlocks permanent unrestricted lifetime withdrawals.'
    },
    {
      q: 'How does the Referral Commission match system work?',
      a: 'Whenever a user registers using your unique code, you receive an immediate tier-1 match bonus equal to 10% of their initial deposit. Additionally, you gain a daily 10% residual commission match on all daily weekday yields generated by your active referrals.'
    }
  ];

  return (
    <div id="home-view" className="min-h-screen bg-[#0C0C0D] text-white font-sans antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-black" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Premium Ambient Light Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-[#b8860b]/20 to-transparent blur-[120px] rounded-full pointer-events-none" />

      {/* Global Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0C0C0D]/75 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-[#1A1A1C] hover:bg-[#252528] px-3.5 py-1.5 rounded-full border border-white/[0.06] text-xs transition duration-200">
                <Globe className="w-4 h-4 text-[#C5A059]" />
                <span className="uppercase text-[#C5A059] font-medium font-mono">{currentLanguage}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              
              <div id="lang-dropdown" className="absolute right-0 mt-2 w-36 bg-[#18181B] rounded-xl border border-white/[0.08] shadow-2xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                {(['en', 'fr', 'es', 'pt', 'ar'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-white/[0.04] text-[#E4E4E7] hover:text-[#D4AF37] transition font-mono flex items-center justify-between"
                  >
                    <span className="capitalize">{lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : lang === 'es' ? 'Español' : lang === 'pt' ? 'Português' : 'العربية'}</span>
                    {currentLanguage === lang && <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA links */}
            <button
              id="nav-login-btn"
              onClick={() => onNavigate('auth', { mode: 'login' })}
              className="text-sm font-medium hover:text-[#D4AF37] transition duration-200 px-3 py-2"
            >
              {t('login')}
            </button>
            <button
              id="nav-get-started-btn"
              onClick={() => onNavigate('auth', { mode: 'signup' })}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#8C6D23] hover:from-[#c59c2b] text-black shadow-lg shadow-[#D4AF37]/10 transform hover:scale-[1.03] active:scale-[0.98] transition duration-200"
            >
              {t('getStarted')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Slogan Banner */}
          <div className="inline-flex items-center gap-2 bg-[#1C170E] text-[#D4AF37] px-4 py-1.5 rounded-full border border-[#D4AF37]/20 text-xs font-mono mb-8 uppercase tracking-widest animate-pulse">
            <Coins className="w-4 h-4" />
            <span>LEADSGLOBAL VENTURES 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display tracking-tighter font-extrabold leading-[1.05] text-white">
            <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent text-glow">
              {t('growingCapital')}
            </span>
          </h1>

          {/* Multilingual Sub-Slogans */}
          <div className="mt-8 flex flex-col items-center gap-2 max-w-3xl mx-auto text-center border-t border-b border-white/5 py-4">
            <p className="text-[#C5A059] font-medium text-sm sm:text-base italic font-mono tracking-tight text-glow">
              "{t('subSlogan1')}"
            </p>
            <p className="text-gray-500 text-xs sm:text-sm tracking-wide font-mono">
              "{t('subSlogan2')}"
            </p>
          </div>

          <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            The sovereign digital wealth ecosystem for consistent asset generation. Fund, invest in premium multi-level yield portfolios, complete simple social promotion tasks, and compound daily weekday earnings directly into your chosen bank account.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-get-started-btn"
              onClick={() => onNavigate('auth', { mode: 'signup' })}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#8C6D23] hover:brightness-110 text-black shadow-xl shadow-[#D4AF37]/15 transform hover:scale-[1.02] transition flex items-center justify-center gap-2"
            >
              <span>{t('getStarted')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="hero-learn-more-btn"
              onClick={() => {
                document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-full bg-[#1A1A1C] hover:bg-[#252528] border border-white/[0.08] hover:border-white/[0.12] transition"
            >
              Explore Plans
            </button>
          </div>

          {/* Features Badges */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { label: 'Weekly Return System', val: 'Monday to Friday', icon: Clock },
              { label: 'Corporate Trust Score', val: '100% Asset Insured', icon: ShieldCheck },
              { label: 'Multi-Level Referral', val: '10% Direct Commission', icon: Users },
              { label: 'High Earning Yields', val: 'Up to $8.00 Daily', icon: TrendingUp }
            ].map((stat, idx) => (
              <div key={idx} className="liquid-glass p-5 rounded-3xl transition duration-300 hover:scale-[1.03] hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/5">
                <stat.icon className="w-5 h-5 text-[#C5A059] mb-2" />
                <h4 className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">{stat.label}</h4>
                <p className="text-white text-sm font-semibold mt-1">{stat.val}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Investment Plans Section */}
      <section id="plans-section" className="py-24 px-6 border-t border-white/[0.04] bg-[#0E0E0F]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-display tracking-tighter font-extrabold text-white text-glow">
              {t('investmentPlans')}
            </h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Activate an elite plan today. Gains occur standard every weekday (Monday through Friday) and pause during weekends. Withdrawals unlock once your accumulated returns match the starting investment amount.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(PLANS).map((p) => {
              const bgClass = p.id === 'platinum' 
                ? 'liquid-glass-premium glass-glow-gold' 
                : 'liquid-glass hover:bg-white/[0.05]';

              return (
                <div
                  key={p.id}
                  className={`relative p-8 rounded-3xl ${bgClass} transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between overflow-hidden`}
                >
                  {p.id === 'platinum' && (
                    <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[9px] font-mono font-bold tracking-widest px-3 py-1 uppercase rounded-bl-xl">
                      Most Lucrative
                    </div>
                  )}

                  <div>
                    <span className="text-gray-400 font-mono text-xs uppercase tracking-widest block mb-1">LeadsGlobal</span>
                    <h3 className="text-xl font-bold font-sans text-white">{p.name}</h3>
                    
                    <div className="my-6">
                      <span className="text-gray-500 text-xs">$</span>
                      <span className="text-5xl font-bold tracking-tight text-[#D4AF37]">{p.price}</span>
                      <span className="text-gray-500 text-xs ml-1 font-mono">USD Deposit</span>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/[0.04] text-xs leading-relaxed text-gray-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C5A059]" />
                        <span>Earn <strong>${p.dailyEarning}.00 daily</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C5A059]" />
                        <span>Monday to Friday returns</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C5A059]" />
                        <span>Withdraw unlock at <strong>${p.price}.00</strong></span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-500 leading-normal">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#C5A059]" />
                        <span>Weekend freeze applied automatically. Out of cycle on Saturday and Sunday.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    id={`purchase-${p.id}-btn`}
                    onClick={() => onNavigate('auth', { mode: 'signup', planId: p.id })}
                    className="mt-8 w-full py-3 px-4 rounded-xl font-bold bg-[#1C1C1E] group-hover:bg-[#252528] text-white hover:text-black hover:bg-[#D4AF37] transition duration-200 text-xs tracking-wider uppercase font-mono"
                  >
                    Invest In {p.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Interactive Return Calculator Widget */}
          <div className="mt-16 liquid-glass-premium p-8 max-w-4xl mx-auto rounded-3xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-[#C5A059] font-mono text-xs uppercase tracking-widest block mb-1">Interactive Fintech Estimator</span>
                <h3 className="text-2xl font-bold text-white font-display tracking-tight">Investment yield calculator</h3>
                <p className="mt-3 text-gray-400 text-xs leading-relaxed">
                  Toggle target plans and timelines to watch returns calculate dynamically on screen. Please notice returns represent Monday-through-Friday payments only.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-wider mb-2">Select Portfolio Tier</label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.values(PLANS).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setCalcPlanId(p.id)}
                          className={`py-2 text-xs font-semibold rounded-lg border transition ${
                            calcPlanId === p.id 
                              ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                              : 'bg-[#18181A] text-gray-400 border-white/[0.05] hover:bg-[#222225]'
                          }`}
                        >
                          ${p.price}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-wider mb-2">Simulation Period ({calcDays} Days)</label>
                    <input
                      type="range"
                      min="7"
                      max="120"
                      value={calcDays}
                      onChange={(e) => setCalcDays(Number(e.target.value))}
                      className="w-full h-1 bg-[#252528] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                      <span>1 Week</span>
                      <span>30 Days</span>
                      <span>60 Days</span>
                      <span>120 Days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="liquid-glass p-6 rounded-2xl h-full flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-200">
                <div>
                  <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Estimated Gains Overview</h4>
                  
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-[#D4AF37] font-mono">${calcResults.earnings}.00</span>
                    <span className="text-xs text-gray-500 font-mono">USD Retorno</span>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">
                    Calculated over <strong>{calcResults.activeWeekdays} working weekdays</strong> (excludes lock intervals on weekends).
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.04]">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Plan Required Purchase:</span>
                    <strong className="text-white font-mono">${PLANS[calcPlanId].price} USD</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Withdrawal Trigger:</span>
                    <span className={`font-mono font-bold ${calcResults.unlocked ? 'text-[#D4AF37]' : 'text-orange-400'}`}>
                      {calcResults.unlocked ? 'CAPITAL UNLOCKED' : 'STILL LOCKED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Referral Earning explanation Section */}
      <section className="py-24 px-6 border-t border-white/[0.04] bg-[#0C0C0D]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[#C5A059] font-mono text-xs uppercase tracking-widest block">Compounding Multipliers</span>
              <h2 className="text-3xl sm:text-5xl font-display tracking-tighter font-extrabold text-white leading-[1.05] text-glow">
                {t('referralEarningsTitle')}
              </h2>
              
              <p className="text-gray-400 text-sm leading-relaxed">
                Unlock instant secondary cash flows by inviting global investors. The LeadsGlobal system utilizes dual rewarding vectors:
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 p-5 rounded-2xl liquid-glass hover:bg-white/[0.05] transition-all duration-200">
                  <div className="w-10 h-10 shrink-0 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37]">
                    <span className="text-base font-bold font-mono">10%</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold">Instant Deposit Commission</h4>
                    <p className="text-xs text-gray-400 mt-1">Receive a 10% cash bonus credited immediately to your general balance the moment your referred users complete their deposit validation approvals.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl liquid-glass hover:bg-white/[0.05] transition-all duration-200">
                  <div className="w-10 h-10 shrink-0 bg-[#C5A059]/10 rounded-xl flex items-center justify-center text-[#C5A059]">
                    <span className="text-base font-bold font-mono">10%</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold">Residual Yield Matching</h4>
                    <p className="text-xs text-gray-400 mt-1">Gain a continuous daily match of 10% on all weekday passive returns harvested by your referrals. Watch your balance grow while assisting friends.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onNavigate('auth', { mode: 'signup' })}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] font-bold text-xs uppercase tracking-widest text-black rounded-full shadow-lg hover:brightness-110 active:scale-95 transition"
                >
                  Acquire Partner Slogan Link
                </button>
              </div>
            </div>

            {/* Visual Referral Diagram */}
            <div className="lg:col-span-6 liquid-glass p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 pb-2 border-b border-white/[0.04] font-mono">Multi-Tier Network simulation</h3>
              
              <div className="space-y-6">
                
                {/* Sponsor */}
                <div className="flex items-center gap-3 p-3 bg-[#1C170E] border border-[#D4AF37]/30 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black text-xs font-bold font-mono flex items-center justify-center shadow-lg">YOU</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-mono text-gray-500 uppercase">Sponsor level 0</p>
                    <p className="text-xs text-[#D4AF37] font-semibold">Accumulating matches & commissions</p>
                  </div>
                  <span className="text-xs font-mono text-[#D4AF37] bg-white/[0.04] px-2 py-0.5 rounded">+10% residual</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-3">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#D4AF37] to-[#8C6D23]" />
                </div>

                {/* Level 1 Reff */}
                <div className="flex items-center gap-3 p-3 liquid-glass rounded-xl pl-8 pr-4">
                  <div className="w-8 h-8 rounded-full bg-[#C5A059] text-black text-xs font-mono flex items-center justify-center">L1</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-mono text-gray-500">Tier 1 Active Affiliate (Invests $240)</p>
                    <p className="text-xs text-white">Generates $8.00 reward daily</p>
                  </div>
                  <span className="text-xs font-mono text-[#C5A059] bg-white/[0.04] px-2 py-0.5 rounded">+$24.00 Instant</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-3">
                  <div className="w-0.5 h-6 bg-gray-600" opacity="0.4" />
                </div>

                {/* Level 2 Reff */}
                <div className="flex items-center gap-3 p-3 liquid-glass rounded-xl pl-12 pr-4 opacity-75">
                  <div className="w-8 h-8 rounded-full bg-gray-700 text-white text-xs font-mono flex items-center justify-center">L2</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-mono text-gray-500">Tier 2 Indirect Affiliate</p>
                    <p className="text-xs text-gray-400">Deposit activities matching queues</p>
                  </div>
                  <span className="text-xs font-mono text-gray-500">Audit Locked</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It works Section */}
      <section className="py-24 px-6 border-t border-white/[0.04] bg-[#0E0E0F]">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-display tracking-tighter font-extrabold text-white text-glow">{t('howItWorks')}</h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Start securing financial accumulation in four simple stages. Robust magic link verifications guarantee account independence.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {[
              { idx: '01', title: 'Register Account', desc: 'Secure an account by submitting your country code, email, and phone. Receive verification magic links instantly.' },
              { idx: '02', title: 'Submit Payment', desc: 'Pre-fund your wallet via Crypto or Bank wire. Upload payment screens. Manual admin validation approves your queue.' },
              { idx: '03', title: 'Activate Portfolio', desc: 'Select and activate from our four weekend-paused high-earning plans (Regular, Gold, Titanium, or Platinum).' },
              { idx: '04', title: 'Secure Withdrawal', desc: 'Once plan yields match the initial deposit amount, unlock quick bank wire transfers after KYC verification approval.' }
            ].map((step, k) => (
              <div key={k} className="relative liquid-glass p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-1 hover:border-[#D4AF37]/20 transition-all duration-200">
                <div>
                  <span className="text-[#D4AF37] font-mono text-3xl font-extrabold block mb-4">{step.idx}</span>
                  <h4 className="text-white text-base font-bold mb-2">{step.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 px-6 border-t border-white/[0.04] bg-[#0C0C0D]">
        <div className="max-w-7xl mx-auto">
          <div className="liquid-glass-premium p-8 sm:p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="text-[#D4AF37] font-mono text-xs uppercase tracking-widest block mb-1">Insured Investment Tiers</span>
                <h2 className="text-2xl sm:text-4xl font-display tracking-tighter font-extrabold text-white">
                  Corporate Security, AML Compliance & Bank Legality
                </h2>
                <p className="mt-4 text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Every user profile operates behind rigorous cryptographic security including Magic Link verification, Rate limiting login protections, and KYC protocols. For legal custody and absolute deposit fidelity:
                </p>
                <div className="mt-6 grid sm:grid-cols-3 gap-6">
                  <div className="border-l-2 border-[#D4AF37] pl-4">
                    <h4 className="text-white text-xs font-bold">100% Encrypted</h4>
                    <p className="text-[11px] text-gray-500 mt-1">PGP security levels validate database operations.</p>
                  </div>
                  <div className="border-l-2 border-[#D4AF37] pl-4">
                    <h4 className="text-white text-xs font-bold">Zero-Hassle KYC</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Compliance documents checked in under 24 hours.</p>
                  </div>
                  <div className="border-l-2 border-[#D4AF37] pl-4">
                    <h4 className="text-white text-xs font-bold">Fraud Quarantine</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Real-time indicators flag suspicious user triggers.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 liquid-glass p-6 rounded-3xl text-center hover:border-white/12 transition-all duration-200">
                <ShieldCheck className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
                <h4 className="text-white text-sm font-bold">Verified LeadsGlobal Node</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">Guaranteed legal compliance. Insured liquidity protects active plan assets against market volatility.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-24 px-6 border-t border-white/[0.04] bg-[#0E0E0F]">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-display tracking-tighter font-extrabold text-white text-glow">{t('faq')}</h2>
            <p className="mt-4 text-gray-400 text-sm">Review transparent answers to any LeadsGlobal operations.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="liquid-glass p-6 rounded-2xl hover:bg-white/[0.04] transition-all duration-200">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                  <span>{faq.q}</span>
                </h4>
                <p className="mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed pl-3.5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-white/[0.04] bg-[#0C0C0D]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[#C5A059] font-mono text-xs uppercase tracking-widest block mb-2">Global Satisfaction</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tighter text-white mb-12 text-glow">Client Testimonials & Feedback</h2>
          
          <div className="liquid-glass p-8 sm:p-12 rounded-3xl max-w-3xl mx-auto relative">
            <p className="text-lg sm:text-xl text-gray-300 italic font-serif leading-relaxed">
              "{testimonials[activeTestimonial].quote}"
            </p>
            <div className="mt-8">
              <h4 className="text-white text-base font-bold">{testimonials[activeTestimonial].name}</h4>
              <p className="text-[#C5A059] text-xs font-mono uppercase mt-1">{testimonials[activeTestimonial].role} &bull; {testimonials[activeTestimonial].country}</p>
              <span className="inline-block mt-3 bg-[#1C170E] text-[#D4AF37] text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded-full uppercase border border-[#D4AF37]/20">Active: {testimonials[activeTestimonial].plan}</span>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${activeTestimonial === i ? 'bg-[#D4AF37] w-6' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="bg-[#09090A] border-t border-white/[0.04] py-16 px-6 text-gray-500 text-xs text-center">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left mb-12">
          
          <div className="space-y-4">
            <Logo />
            <p className="text-[#8C6D23] font-mono text-[10px] uppercase tracking-wider mt-2">
              Corporate Registry No: LEADS-RGB-2026-X491
            </p>
            <p className="text-gray-400 mt-2 leading-relaxed">
              Sovereign wealth multipliers. Building the global framework of secure indexing, referral compensation matching pools, and fast wire transfers.
            </p>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-mono uppercase tracking-wider mb-4 font-bold">Investment Plan Portfolios</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Regular Plan — $30 ($1/day)</li>
              <li>Gold Plan — $60 ($2/day)</li>
              <li>Titanium Plan — $120 ($4/day)</li>
              <li>Platinum Plan — $240 ($8/day)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-mono uppercase tracking-wider mb-4 font-bold">Client Support Channels</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Live Chat Ticket Center & Help</li>
              <li>Compliance ID Verification team</li>
              <li>Corporate email: compliance@leadsglobal.com</li>
              <li>WhatsApp Integration Help desk</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-mono uppercase tracking-wider mb-4 font-bold">Corporate Disclaimers</h4>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              Every financial transaction utilizes PGP cryptographic tokens. Daily calculations execute on standard UTC timestamps. KYC documents undergo broker review. Simulated indices operate under sandbox rules.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-gray-600 gap-4">
          <p>&copy; 2026 LeadsGlobal Ventures Inc. All rights reserved. Registered under standard corporate AML legal structures.</p>
          <div className="flex gap-4 text-xs font-mono uppercase tracking-wider">
            <button className="hover:text-white transition">Terms of Service</button>
            <span>&bull;</span>
            <button className="hover:text-white transition">Privacy Policy</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
