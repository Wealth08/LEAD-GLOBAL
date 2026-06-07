import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Globe,
  User,
  Bell,
  Download,
  FileText,
  MessageSquare,
  HelpCircle,
  Send,
  Zap,
  Info,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  CreditCard,
  CheckCircle2,
  ListFilter,
  RefreshCw,
} from 'lucide-react';
import Logo from './Logo';
import { dbService, PLANS } from '../supabaseMock';
import {
  UserProfile,
  Transaction,
  SupportTicket,
  BankAccount,
  DailyTask,
  TaskLog,
  Language,
} from '../types';
import { TRANSLATIONS } from '../translations';

interface DashboardProps {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'admin', payload?: any) => void;
  currentLanguage: Language;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate, currentLanguage }: DashboardProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'invest' | 'funding' | 'referrals' | 'tasks' | 'kyc' | 'support'
  >('overview');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositHash, setDepositHash] = useState('');
  const [depositProofUrl, setDepositProofUrl] = useState('');

  // Bank form
  const [bankName, setBankName] = useState('');
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [iban, setIban] = useState('');
  const [bankCountry, setBankCountry] = useState('United Kingdom');
  const [currency, setCurrency] = useState('USD');
  const [isPreferred, setIsPreferred] = useState(true);

  // KYC form
  const [kycFullName, setKycFullName] = useState('');
  const [kycIdType, setKycIdType] = useState('Passport');
  const [kycIdNumber, setKycIdNumber] = useState('');
  const [kycSelfieUrl, setKycSelfieUrl] = useState('');
  const [kycAddressUrl, setKycAddressUrl] = useState('');

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [withdrawBankId, setWithdrawBankId] = useState('');

  // Support tickets
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Finance');
  const [ticketMessage, setTicketMessage] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Notification prefs
  const [tgHandle, setTgHandle] = useState('');
  const [waNum, setWaNum] = useState('');
  const [notifPreferences, setNotifPreferences] = useState({
    telegram: true,
    whatsapp: true,
    email: true,
  });

  // UI states
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks which action is in-flight

  // ── Data Loading ────────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const profile = await dbService.getCurrentUser();
      if (!profile) {
        onNavigate('home');
        return;
      }
      setUser(profile);

      // Prefill notification fields from profile
      if (profile.telegramHandle) setTgHandle(profile.telegramHandle);
      if (profile.whatsappNumber) setWaNum(profile.whatsappNumber);
      setNotifPreferences(profile.notificationsEnabled);

      // KYC prefill
      if (profile.kyc) {
        setKycFullName(profile.kyc.fullName || '');
        setKycIdType(profile.kyc.idType || 'Passport');
        setKycIdNumber(profile.kyc.idNumber || '');
      }

      // Parallel fetches
      const [txs, tks, logs, banks] = await Promise.all([
        dbService.getCurrentUserTransactions(),
        dbService.getCurrentUserTickets(),
        dbService.getCurrentUserTaskLogs(),
        dbService.getBankAccounts(),
      ]);

      setTransactions(txs);
      setTickets(tks);
      setTaskLogs(logs);
      setBankAccounts(banks);
    } catch (err) {
      console.error('refreshData error:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [onNavigate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showToastMsg = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const tStr = (key: string) =>
    TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS['en'][key] || key;

  const isRTL = currentLanguage === 'ar';

  // ── Event Handlers ──────────────────────────────────────────────────────────
  const handleCopyReferral = () => {
    if (!user) return;
    const link = `https://leadsglobal.com/signup?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToastMsg('success', 'Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveNotificationPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await withLoading('notif', async () => {
      await dbService.updateNotificationSettings(tgHandle, waNum, notifPreferences);
      await refreshData();
      showToastMsg('success', 'Notification preferences updated.');
    });
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accName || !accNumber || !swiftCode) {
      showToastMsg('error', 'All essential bank fields are required.');
      return;
    }
    await withLoading('addbank', async () => {
      const res = await dbService.addBankAccount({
        bankName,
        accountName: accName,
        accountNumber: accNumber,
        swiftCode,
        iban: iban || undefined,
        country: bankCountry,
        currency,
        isPreferred,
      });
      if (res.success) {
        showToastMsg('success', res.message);
        setBankName(''); setAccName(''); setAccNumber('');
        setSwiftCode(''); setIban('');
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) {
      showToastMsg('error', 'Please enter a valid deposit amount.');
      return;
    }
    await withLoading('deposit', async () => {
      const simulatedUrl =
        depositProofUrl ||
        `https://leadsglobal.com/proofs/deposit_${Math.floor(1000 + Math.random() * 9000)}.jpg`;
      const res = await dbService.submitDeposit(amountNum, depositHash || undefined, simulatedUrl);
      if (res.success) {
        showToastMsg('success', res.message);
        setDepositAmount('100');
        setDepositHash('');
        setDepositProofUrl('');
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleBuyPlan = async (planId: 'regular' | 'gold' | 'titanium' | 'platinum') => {
    await withLoading(`plan_${planId}`, async () => {
      const res = await dbService.purchaseInvestmentPlan(planId);
      if (res.success) {
        showToastMsg('success', res.message);
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFullName || !kycIdNumber) {
      showToastMsg('error', 'Legal name and ID number are required.');
      return;
    }
    await withLoading('kyc', async () => {
      const selfie = kycSelfieUrl || 'https://leadsglobal.com/kyc/selfie_verified.jpg';
      const address = kycAddressUrl || 'https://leadsglobal.com/kyc/address_verified.jpg';
      const res = await dbService.submitKYC({
        fullName: kycFullName,
        idType: kycIdType,
        idNumber: kycIdNumber,
        selfieUrl: selfie,
        addressProofUrl: address,
      });
      if (res.success) {
        showToastMsg('success', res.message);
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handlePayKYCFee = async () => {
    await withLoading('kycfee', async () => {
      const res = await dbService.payKYCFee();
      if (res.success) {
        showToastMsg('success', res.message);
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleWithdrawAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      showToastMsg('error', 'Enter a valid withdrawal amount.');
      return;
    }
    if (!withdrawBankId) {
      showToastMsg('error', 'Select a linked bank account.');
      return;
    }
    await withLoading('withdraw', async () => {
      const res = await dbService.submitWithdrawal(amountNum, withdrawBankId);
      if (res.success) {
        showToastMsg('success', res.message);
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleOpenTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      showToastMsg('error', 'Subject and message are required.');
      return;
    }
    await withLoading('ticket', async () => {
      const res = await dbService.openSupportTicket(ticketSubject, ticketCategory, ticketMessage);
      if (res.success) {
        showToastMsg('success', res.message);
        setTicketSubject('');
        setTicketMessage('');
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !ticketReplyText) return;
    await withLoading('reply', async () => {
      const res = await dbService.replyToTicket(selectedTicketId, ticketReplyText, 'user');
      if (res.success) {
        setTicketReplyText('');
        await refreshData();
      } else {
        showToastMsg('error', res.message);
      }
    });
  };

  const handleTaskAction = async (taskId: string, title?: string) => {
    if (taskId === 'task-checkin') {
      await withLoading(`task_${taskId}`, async () => {
        const res = await dbService.submitTaskProof(taskId);
        if (res.success) {
          showToastMsg('success', res.message);
          await refreshData();
        } else {
          showToastMsg('error', res.message);
        }
      });
    } else {
      const proofStr = prompt(
        `Submit proof for: "${title}"\nPaste your social media link or handle proving completion:`
      );
      if (proofStr === null) return;
      if (!proofStr.trim()) {
        showToastMsg('error', 'You must supply a proof text or link.');
        return;
      }
      await withLoading(`task_${taskId}`, async () => {
        const res = await dbService.submitTaskProof(taskId, proofStr);
        if (res.success) {
          showToastMsg('success', res.message);
          await refreshData();
        } else {
          showToastMsg('error', res.message);
        }
      });
    }
  };

  const handleLogout = async () => {
    await dbService.logout();
    onNavigate('home');
  };

  const handlePrintReceipt = () => window.print();

  // ── Guard: loading + not authed ─────────────────────────────────────────────
  if (isLoadingData && !user) {
    return (
      <div className="min-h-screen bg-[#0C0C0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Loading portfolio…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activePlanDetails = user.activePlanId ? PLANS[user.activePlanId] : null;
  const planTarget = activePlanDetails ? activePlanDetails.price : 0;
  const planAccumulated = user.planAccumulatedEarnings;
  const targetCompletedRatio =
    planTarget > 0 ? Math.min(100, (planAccumulated / planTarget) * 100) : 0;
  const withdrawalUnlockedState = activePlanDetails && planAccumulated >= planTarget;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      id="dashboard-view"
      className="min-h-screen bg-[#0C0C0D] text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-16"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl flex items-center gap-3 animate-bounce shadow-2xl ${
            toast.type === 'success'
              ? 'bg-[#18160E] border-2 border-[#D4AF37] text-[#D4AF37]'
              : 'bg-red-950 border-2 border-red-500 text-red-100'
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-mono font-bold uppercase tracking-wider">{toast.text}</p>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#030303]/70 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo iconOnly className="w-8 h-8" />
            <div className="h-6 w-[1px] bg-white/10" />
            <div>
              <p className="text-xs text-gray-500 font-mono">Portfolio Vault</p>
              <h1 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
                {user.email.split('@')[0]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-mono bg-white/[0.02] border border-white/[0.05] text-gray-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  user.status === 'Active' ? 'bg-[#D4AF37]' : 'bg-amber-500 animate-pulse'
                }`}
              />
              Status: <strong className="text-white ml-1">{user.status}</strong>
            </span>

            <button
              id="disconnect-btn"
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-[#D4AF37] font-mono border border-white/[0.1] px-3.5 py-1.5 rounded-full hover:bg-white/[0.02] transition"
            >
              {tStr('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-6 mt-8">

        {/* Alert Banners */}
        <div className="space-y-4 mb-8">
          {!user.isEmailVerified && (
            <div className="p-4 bg-[#1C170E] border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold uppercase block mb-1">EMAIL VERIFICATION REQUIRED</span>
                <p>
                  Please verify your email address to unlock all platform features — plan
                  purchases, tasks, referral earnings, and withdrawals.
                </p>
              </div>
            </div>
          )}

          {user.isEmailVerified && user.status === 'Pending Verification' && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/20 text-amber-200 rounded-xl flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0 animate-spin" />
              <div className="text-xs">
                <span className="font-bold uppercase block mb-1">PAYMENT PENDING VERIFICATION</span>
                <p>
                  Deposit proof is awaiting admin review. Features remain locked until approved.
                </p>
                <button
                  onClick={() => setActiveTab('funding')}
                  className="mt-2 px-3.5 py-1 border border-amber-500/30 rounded text-amber-400 font-bold uppercase text-[9px] hover:bg-amber-500 hover:text-black transition inline-block"
                >
                  Upload funding proof
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto pb-2 border-b border-white/[0.04] mb-8 gap-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Wallet Vault', icon: Briefcase },
            { id: 'invest', label: 'Investment Plans', icon: TrendingUp },
            { id: 'funding', label: 'Deposit & Proof', icon: PlusCircle },
            { id: 'referrals', label: 'Partners System', icon: Users },
            { id: 'tasks', label: 'Daily Tasks', icon: Zap },
            { id: 'kyc', label: tStr('kycStatus'), icon: ShieldCheck },
            { id: 'support', label: 'Support Helpdesk', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0 transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] text-black font-extrabold shadow-md'
                  : 'liquid-glass text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Balance Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: 'Utilizable Wallet',
                  val: user.walletBalance,
                  desc: 'Usable balance for upgrades and processing fees.',
                  color: 'text-white',
                },
                {
                  label: 'Weekday Profit Returns',
                  val: user.dailyEarningsAccumulated,
                  desc: 'Accumulated Monday–Friday yields.',
                  color: 'text-[#D4AF37] text-glow',
                },
                {
                  label: 'Referral Team Earnings',
                  val: user.referralEarningsAccumulated,
                  desc: 'Instant commission bonuses from referred nodes.',
                  color: 'text-[#C5A059] text-glow',
                },
                {
                  label: 'Total Approved Funding',
                  val: user.totalDeposited,
                  desc: 'Sum of all verified deposits on record.',
                  color: 'text-emerald-400 text-glow',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="liquid-glass p-5 rounded-3xl flex flex-col justify-between hover:scale-[1.03] transition-all duration-300"
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider block mb-1">
                      {card.label}
                    </span>
                    <span className={`text-3xl font-bold font-mono tracking-tight ${card.color}`}>
                      ${card.val.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal mt-3 border-t border-white/[0.04] pt-2">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Mid Row: Chart + Plan Progress */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Growth Chart */}
              <div className="lg:col-span-8 liquid-glass p-6 rounded-3xl overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">
                      Real-Time Simulation Analytics
                    </span>
                    <h3 className="text-base font-bold text-white font-display tracking-tight text-glow">
                      Yield Growth Trendline (Weekdays)
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-[#1A1911] border border-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-1 rounded-full">
                    Insured Portfolio Index
                  </span>
                </div>

                <div className="relative h-64 w-full flex items-end justify-center py-4 bg-[#0A0A0B]/50 rounded-2xl border border-white/[0.02]">
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                    {[0,1,2,3].map(i => <div key={i} className="border-t border-dashed border-gray-600 w-full" />)}
                  </div>

                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 50 210 Q 150 170 250 140 T 450 110 T 650 60 T 800 30 L 800 250 L 50 250 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M 50 210 Q 150 170 250 140 T 450 110 T 650 60 T 800 30"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {[
                      [50, 210], [250, 140], [450, 110], [650, 60],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="4" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="2" />
                    ))}
                    <circle cx="800" cy="30" r="5" fill="#D4AF37" />
                  </svg>

                  <div className="absolute bottom-2 inset-x-0 px-6 flex justify-between text-[9px] font-mono text-gray-500">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span>
                    <span>Fri (Credit)</span><span>Weekend (Pause)</span>
                  </div>

                  <div className="absolute top-6 left-6 flex items-center gap-2 bg-[#141416]/90 py-1.5 px-3 rounded-lg border border-white/[0.05]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-[10px] font-mono text-gray-400">
                      Yield Compounding: <strong className="text-white">+12.4%</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
                  <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <p>
                    Earnings generated automatically Mon–Fri. Saturday and Sunday are
                    excluded.
                  </p>
                </div>
              </div>

              {/* Plan Progress */}
              <div className="lg:col-span-4 liquid-glass p-6 rounded-3xl flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider block mb-2">
                    TARGET MILESTONE INDEX
                  </span>
                  <h3 className="text-base font-bold text-white font-display tracking-tight text-glow">
                    Withdrawal Release Condition
                  </h3>

                  {activePlanDetails ? (
                    <div className="mt-5 space-y-4">
                      <div className="bg-[#0C0C0D] p-3 rounded-xl border border-white/[0.02]">
                        <div className="flex justify-between text-xs mb-1.5 font-mono">
                          <span className="text-gray-400">Total Returns Achieved:</span>
                          <strong className="text-[#D4AF37]">${planAccumulated.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-gray-400">Target Unlock:</span>
                          <strong className="text-gray-300">${planTarget.toFixed(2)}</strong>
                        </div>
                        <div className="mt-3.5 w-full bg-white/[0.04] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#D4AF37] to-[#C5A059] h-full rounded-full transition-all duration-500"
                            style={{ width: `${targetCompletedRatio}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2.5 text-[10px] text-gray-500 font-mono">
                          <span>Verified progress:</span>
                          <span>{targetCompletedRatio.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs text-gray-400 leading-normal bg-[#1C170E]/30 p-3 rounded-xl border border-[#D4AF37]/10">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                          <p>
                            Withdrawals unlock once plan returns equal the original investment
                            (${activePlanDetails.price}).
                          </p>
                        </div>
                        <div className="flex items-start gap-2 border-t border-white/[0.03] pt-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p>KYC and $15 processing fee required before bank payouts.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 text-center py-6">
                      <Briefcase className="w-12 h-12 text-gray-700 mx-auto opacity-40" />
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        No active plan detected. Purchase an investment package to start
                        tracking returns.
                      </p>
                      <button
                        onClick={() => setActiveTab('invest')}
                        className="mt-4 px-4 py-2 bg-[#D4AF37] hover:bg-[#8C6D23] text-black font-bold text-xs font-mono uppercase rounded-lg"
                      >
                        Explore Packages
                      </button>
                    </div>
                  )}
                </div>

                {activePlanDetails && (
                  <div className="mt-6 border-t border-white/[0.04] pt-4 space-y-3">
                    <button
                      disabled={!withdrawalUnlockedState}
                      onClick={() => {
                        if (user.kycStatus === 'None') {
                          showToastMsg('error', 'Complete KYC before withdrawing.');
                          setActiveTab('kyc');
                        } else if (user.kycStatus === 'Pending') {
                          showToastMsg('error', 'KYC audit pending. Please wait.');
                          setActiveTab('kyc');
                        } else {
                          setActiveTab('funding');
                        }
                      }}
                      className={`w-full py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-extrabold transition text-center ${
                        withdrawalUnlockedState
                          ? 'bg-[#D4AF37] text-black hover:brightness-110 active:scale-95'
                          : 'bg-white/[0.03] text-gray-500 border border-white/[0.05] cursor-not-allowed'
                      }`}
                    >
                      {withdrawalUnlockedState
                        ? 'Execute Wire Withdrawal'
                        : 'Withdrawal Locked (Target Incomplete)'}
                    </button>

                    {!withdrawalUnlockedState && (
                      <span className="block text-center text-[9px] text-gray-500 font-mono italic">
                        Earn ${(planTarget - planAccumulated).toFixed(2)} more to unlock.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Transactions + Notifications */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Transaction Table */}
              <div className="lg:col-span-8 liquid-glass p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/[0.04]">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-display text-glow">
                    Cryptographic Audit Log / Receipts
                  </h3>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Total: {transactions.length}
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs mt-3">No transactions logged yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead>
                        <tr className="border-b border-white/[0.03] text-gray-500 text-[9px] uppercase tracking-wider font-mono">
                          <th className="pb-3">Receipt ID</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3 text-right">Amount</th>
                          <th className="pb-3 text-center">Status</th>
                          <th className="pb-3 text-center">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/[0.01]">
                            <td className="py-3">
                              <p className="font-mono text-[10px] text-[#C5A059] font-bold">{tx.receiptId}</p>
                              <span className="text-[9px] text-gray-500 font-mono">
                                {new Date(tx.date).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3 capitalize">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono leading-none ${
                                  tx.type === 'deposit'
                                    ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400'
                                    : tx.type === 'withdrawal'
                                    ? 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
                                    : 'bg-[#1C170E] border border-[#D4AF37]/20 text-[#D4AF37]'
                                }`}
                              >
                                <span className="w-1 h-1 rounded-full bg-current" />
                                {tx.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono font-semibold">
                              <span className={tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}>
                                {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                                  tx.status === 'approved'
                                    ? 'bg-emerald-950 text-emerald-400 font-bold'
                                    : tx.status === 'rejected'
                                    ? 'bg-red-950 text-red-400'
                                    : 'bg-gray-800 text-gray-400 animate-pulse'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => setViewingReceipt(tx)}
                                className="px-3.5 py-1 bg-white/[0.02] border border-white/[0.08] hover:border-[#D4AF37] hover:text-[#D4AF37] transition font-mono text-[9px] uppercase tracking-wider rounded"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notification Feed placeholder */}
              <div className="lg:col-span-4 bg-[#111112] p-6 rounded-3xl border border-white/[0.04]">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.03] mb-4">
                  <Bell className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Activity Alerts
                  </h3>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Real-time alerts for transactions, KYC milestones, and withdrawal events appear
                  here as they are processed by the platform.
                </p>
                <div className="mt-4 p-4 bg-[#0A0A0B] text-center rounded-xl border border-white/[0.02]">
                  <span className="text-[10px] text-gray-600 font-mono">
                    Connect Telegram or WhatsApp in your profile to receive real push alerts.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INVEST TAB ── */}
        {activeTab === 'invest' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-[#111112] p-8 rounded-3xl border border-white/[0.04]">
              <span className="text-[#C5A059] font-mono text-xs uppercase block mb-1">
                Portfolio Tier Management
              </span>
              <h2 className="text-xl font-bold">Purchase or upgrade your investment plan:</h2>
              <p className="text-xs text-gray-400 max-w-2xl mt-2 leading-relaxed">
                Choose a plan matching your liquidity. Only one active plan generates daily yields
                at a time.
              </p>

              {user.activePlanId && (
                <div className="mt-6 p-4 bg-gradient-to-r from-[#1C170E] to-[#121214] border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest block font-bold animate-pulse">
                      Running Package
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      Active: {PLANS[user.activePlanId].name} (${PLANS[user.activePlanId].price})
                    </h4>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-gray-500">Accumulated Returns:</span>
                    <p className="text-lg font-bold text-[#D4AF37]">
                      ${user.planAccumulatedEarnings.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {Object.values(PLANS).map((p) => {
                  const isOwned = user.activePlanId === p.id;
                  const canBuy = user.walletBalance >= p.price;
                  const isLoading = actionLoading === `plan_${p.id}`;

                  return (
                    <div
                      key={p.id}
                      className={`p-6 bg-[#0E0E0F] rounded-2xl border ${
                        isOwned ? 'border-[#D4AF37]' : 'border-white/[0.04]'
                      } flex flex-col justify-between h-80`}
                    >
                      <div>
                        <h3 className="text-base font-bold text-white">{p.name}</h3>
                        <p className="text-3xl font-bold text-[#D4AF37] font-mono mt-2">
                          ${p.price}
                        </p>
                        <div className="mt-4 space-y-2 text-[11px] text-gray-400">
                          <p>&bull; Earn <strong>${p.dailyEarning}/day</strong> weekdays</p>
                          <p>&bull; Sat/Sun pause</p>
                          <p>&bull; Target: <strong>${p.price}</strong> before withdrawal</p>
                        </div>
                      </div>

                      <button
                        disabled={isOwned || !canBuy || user.status === 'Pending Verification' || isLoading}
                        onClick={() => handleBuyPlan(p.id)}
                        className={`mt-4 w-full py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 ${
                          isOwned
                            ? 'bg-[#1C170E] text-[#D4AF37] border border-[#D4AF37]/30 cursor-default'
                            : canBuy && user.status !== 'Pending Verification'
                            ? 'bg-[#D4AF37] hover:bg-[#8C6D23] text-black hover:brightness-110 active:scale-95'
                            : 'bg-white/[0.03] text-gray-500 border border-white/[0.05] cursor-not-allowed'
                        }`}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isOwned ? (
                          'Currently Active'
                        ) : !canBuy ? (
                          'Insufficient Balance'
                        ) : user.status === 'Pending Verification' ? (
                          'Verify deposit first'
                        ) : (
                          `Activate $${p.price} Plan`
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── FUNDING TAB ── */}
        {activeTab === 'funding' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Deposit Proof Form */}
            <div className="bg-[#111112] p-8 rounded-3xl border border-white/[0.04] space-y-6">
              <div>
                <span className="text-[#C5A059] font-mono text-xs uppercase block mb-1">
                  Capital Funding Portal
                </span>
                <h2 className="text-xl font-bold">Submit Deposit Proof</h2>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-2xl">
                  Transfer USDT (TRC-20 / ERC-20) or BTC to our secure custodian wallet then
                  submit the blockchain TX hash as proof. Our auditors approve within 1–2 hours.
                </p>
              </div>

              <div className="p-4 bg-[#0A0A0B] rounded-2xl border border-[#D4AF37]/15 space-y-2">
                <span className="text-[9px] text-[#D4AF37] font-mono uppercase font-bold">
                  USDT TRC-20 Deposit Address
                </span>
                <div className="flex items-center gap-3">
                  <code className="text-sm text-white font-mono break-all">
                    TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
                      showToastMsg('success', 'Wallet address copied.');
                    }}
                    className="shrink-0 p-2 bg-white/[0.04] hover:bg-[#D4AF37] hover:text-black rounded-lg transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">
                  Minimum deposit: $30. Only USDT TRC-20, ERC-20 accepted.
                </p>
              </div>

              <form onSubmit={handleDepositSubmit} className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    Deposit Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    Blockchain TX Hash (optional)
                  </label>
                  <input
                    type="text"
                    value={depositHash}
                    onChange={(e) => setDepositHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    Proof Screenshot URL (optional)
                  </label>
                  <input
                    type="text"
                    value={depositProofUrl}
                    onChange={(e) => setDepositProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={actionLoading === 'deposit'}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:brightness-110 text-black font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading === 'deposit' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Submit Deposit Proof'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bank Account Form */}
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-5">
              <h3 className="text-base font-bold text-white">Link Bank Account for Withdrawals</h3>

              {bankAccounts.length > 0 && (
                <div className="space-y-2">
                  {bankAccounts.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 bg-[#0C0C0D] rounded-xl border border-white/[0.03]"
                    >
                      <div>
                        <p className="text-xs font-bold text-white font-mono">{b.bankName}</p>
                        <p className="text-[9px] text-gray-500 font-mono">
                          {b.accountName} · {b.accountNumber}
                          {b.isPreferred && (
                            <span className="ml-2 text-[#D4AF37]">★ Preferred</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          await dbService.deleteBankAccount(b.id);
                          await refreshData();
                        }}
                        className="text-gray-600 hover:text-red-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddBank} className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Bank Name', val: bankName, setter: setBankName, ph: 'Barclays Bank PLC' },
                  { label: 'Account Holder Name', val: accName, setter: setAccName, ph: 'John Smith' },
                  { label: 'Account Number / IBAN', val: accNumber, setter: setAccNumber, ph: 'GB29BARC...' },
                  { label: 'SWIFT / BIC Code', val: swiftCode, setter: setSwiftCode, ph: 'BARCGB2DXXX' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[9px] font-mono text-gray-500 uppercase">{f.label}</label>
                    <input
                      type="text"
                      required
                      value={f.val}
                      onChange={(e) => f.setter(e.target.value)}
                      placeholder={f.ph}
                      className="w-full mt-1 bg-[#1A1A1C] border border-white/[0.06] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading === 'addbank'}
                    className="w-full py-2.5 bg-white/[0.03] hover:bg-[#D4AF37] hover:text-black border border-white/[0.08] text-white rounded-lg text-xs font-mono uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading === 'addbank' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Link Bank Account'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Withdrawal Form */}
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-4">
              <h3 className="text-base font-bold text-white">Initiate Secure Wire Transfer</h3>
              <p className="text-xs text-gray-400">
                Returns can be withdrawn once the plan's circular target has completed.
              </p>

              <form onSubmit={handleWithdrawAmount} className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    Linked Bank Account
                  </label>
                  <select
                    value={withdrawBankId}
                    onChange={(e) => setWithdrawBankId(e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  >
                    <option value="">-- Select bank account --</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    Withdrawal Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === 'withdraw'}
                  className="w-full py-3 rounded-xl bg-orange-950/20 hover:bg-[#D4AF37] border border-[#D4AF37]/20 hover:text-black hover:border-[#D4AF37] text-[#D4AF37] font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading === 'withdraw' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Transmit Withdrawal'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── REFERRALS TAB ── */}
        {activeTab === 'referrals' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04]">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <span className="text-[#C5A059] font-mono text-xs uppercase block">
                    Affiliate Partner Hub
                  </span>
                  <h2 className="text-xl font-bold">Compounding Referral Compensation Pools</h2>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Receive <strong>10% instant commission</strong> on all approved deposits
                    introduced by your referral link. Share your unique code to watch
                    multipliers stack dynamically.
                  </p>

                  <div className="p-4 bg-[#0C0C0D] rounded-2xl border border-white/[0.05] inline-flex items-center gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase">
                        Your referral code
                      </span>
                      <p className="text-base font-bold text-[#D4AF37] font-mono tracking-wider mt-0.5">
                        {user.referralCode}
                      </p>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <button
                      id="copy-ref-link-btn"
                      onClick={handleCopyReferral}
                      className="px-4 py-2 bg-white/[0.04] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition font-mono uppercase"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-gradient-to-r from-[#17140B] to-[#121214] p-5 rounded-2xl border border-[#D4AF37]/20 flex justify-between items-center text-center">
                  <div className="flex-1">
                    <span className="text-2xl font-bold font-mono text-white">—</span>
                    <p className="text-[10px] text-gray-500 uppercase font-mono mt-1">
                      Referred Investors
                    </p>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10" />
                  <div className="flex-1">
                    <span className="text-2xl font-bold font-mono text-[#D4AF37]">
                      ${user.referralEarningsAccumulated.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-gray-500 uppercase font-mono mt-1">
                      Total Team Bonus
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-[#111112] p-6 rounded-3xl border border-white/[0.04]">
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-4 mb-6">
                <div>
                  <span className="text-[#C5A059] font-mono text-xs uppercase block">
                    Task Incentivize Platform
                  </span>
                  <h2 className="text-lg font-bold">Daily Promotional Assignments</h2>
                </div>
                <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 px-3 py-1 text-gray-400 rounded-full">
                  Updated Today
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    id: 'task-checkin',
                    title: 'Daily Platform Attendance Check-in',
                    reward: 0.5,
                    type: 'Every 24h — instant credit',
                    desc: 'Click the check-in button once per day to verify your presence and earn $0.50 instantly credited to your wallet.',
                  },
                  {
                    id: 'task-telegram',
                    title: 'Join Official Telegram Channel',
                    reward: 1.0,
                    type: 'Manual admin review required',
                    desc: 'Join the LeadsGlobal Telegram news feed. Submit your Telegram username as proof. Earns $1.00.',
                  },
                  {
                    id: 'task-twitter',
                    title: 'Share LeadsGlobal Certificate on X / Twitter',
                    reward: 2.0,
                    type: 'Manual admin review required',
                    desc: 'Tweet a screenshot of your approved receipt or profile stats with #LeadsGlobal. Paste the tweet URL. Earns $2.00.',
                  },
                ].map((tsk) => {
                  const log = taskLogs.find((l) => l.taskId === tsk.id);
                  const isPending = log?.status === 'pending';
                  const isApproved = log?.status === 'approved';
                  const isLoading = actionLoading === `task_${tsk.id}`;

                  return (
                    <div
                      key={tsk.id}
                      className="p-5 bg-[#0C0C0D] rounded-2xl border border-white/[0.03] flex flex-col justify-between min-h-[210px]"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">
                            {tsk.type}
                          </span>
                          <span className="text-xs font-mono text-[#D4AF37] bg-[#1C170E] px-2.5 py-0.5 rounded border border-[#D4AF37]/20 font-bold">
                            +${tsk.reward.toFixed(2)} USD
                          </span>
                        </div>
                        <h4 className="text-sm font-bold mt-2 text-white">{tsk.title}</h4>
                        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{tsk.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.02] flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-mono">
                          Status:{' '}
                          <strong className="text-white">
                            {log ? log.status.toUpperCase() : 'NOT STARTED'}
                          </strong>
                        </span>
                        <button
                          disabled={
                            isPending ||
                            isApproved ||
                            user.status === 'Pending Verification' ||
                            isLoading
                          }
                          onClick={() => handleTaskAction(tsk.id, tsk.title)}
                          className={`px-4 py-2 font-mono text-[9px] uppercase tracking-wider rounded font-bold transition flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/10 cursor-not-allowed'
                              : isPending
                              ? 'bg-gray-800 text-gray-400 cursor-not-allowed animate-pulse'
                              : user.status === 'Pending Verification'
                              ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                              : 'bg-[#D4AF37] text-black hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : isApproved ? (
                            'Completed'
                          ) : isPending ? (
                            'Under Review'
                          ) : user.status === 'Pending Verification' ? (
                            'Verify deposit first'
                          ) : (
                            'Complete Task'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── KYC TAB ── */}
        {activeTab === 'kyc' && (
          <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-8 bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.03] pb-4">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <h2 className="text-lg font-bold">KYC Identity Compliance Portal</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    KYC approval required before bank withdrawals.
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="grid sm:grid-cols-2 gap-4 bg-[#0C0C0D] p-4 rounded-2xl border border-white/[0.02]">
                <div>
                  <span className="text-[10px] text-gray-500 font-mono uppercase">
                    KYC Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.kycStatus === 'Approved'
                          ? 'bg-emerald-400'
                          : user.kycStatus === 'Pending'
                          ? 'bg-amber-400 animate-pulse'
                          : user.kycStatus === 'Rejected'
                          ? 'bg-red-400'
                          : 'bg-gray-600'
                      }`}
                    />
                    <span
                      className={`text-sm font-bold font-mono ${
                        user.kycStatus === 'Approved'
                          ? 'text-emerald-400'
                          : user.kycStatus === 'Pending'
                          ? 'text-amber-400'
                          : user.kycStatus === 'Rejected'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {user.kycStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-mono uppercase">
                    Processing Fee
                  </span>
                  <p
                    className={`text-sm font-bold font-mono mt-1 ${
                      user.kyc?.hasPaidFee ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {user.kyc?.hasPaidFee ? '✓ Paid ($15)' : '⚠ Unpaid ($15)'}
                  </p>
                </div>
              </div>

              {user.kycStatus === 'Rejected' && user.kyc?.rejectionReason && (
                <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-300">
                  <strong>Rejection Reason:</strong> {user.kyc.rejectionReason}
                </div>
              )}

              <form onSubmit={handleKYCSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Legal Name', val: kycFullName, setter: setKycFullName, ph: 'John Smith' },
                    { label: 'ID Number', val: kycIdNumber, setter: setKycIdNumber, ph: 'PA1234567' },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                        {f.label}
                      </label>
                      <input
                        type="text"
                        required
                        value={f.val}
                        onChange={(e) => f.setter(e.target.value)}
                        placeholder={f.ph}
                        className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    ID Type
                  </label>
                  <select
                    value={kycIdType}
                    onChange={(e) => setKycIdType(e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  >
                    {['Passport', "Driver's License", 'National ID', 'Residence Permit'].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-gray-500 uppercase block mb-1">
                    Selfie with ID — Image URL
                  </label>
                  <input
                    type="text"
                    value={kycSelfieUrl}
                    onChange={(e) => setKycSelfieUrl(e.target.value)}
                    placeholder="https://your-host.com/selfie.jpg"
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    user.kycStatus === 'Approved' ||
                    user.kycStatus === 'Pending' ||
                    actionLoading === 'kyc'
                  }
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:brightness-110 active:scale-95 text-black font-extrabold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading === 'kyc' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : user.kycStatus === 'Approved' ? (
                    'Compliance Certified ✓'
                  ) : user.kycStatus === 'Pending' ? (
                    'Awaiting Audit Review…'
                  ) : (
                    'Submit KYC Documents'
                  )}
                </button>
              </form>
            </div>

            {/* KYC Fee Panel */}
            <div className="lg:col-span-4 bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-4">
              <h3 className="text-base font-bold text-white">Security Validation Fee</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                A one-time $15 processing fee is charged to validate passport authenticity and
                comply with AML regulations. This permanently unlocks wire transfer capabilities.
              </p>

              <div className="bg-[#0C0C0D] p-4 rounded-2xl border border-[#D4AF37]/15">
                <span className="text-[9px] font-mono text-[#D4AF37] uppercase">
                  Secure Audit Fee
                </span>
                <p className="text-3xl font-bold text-white font-mono mt-1">
                  $15.00 <span className="text-xs text-gray-500">USD</span>
                </p>
              </div>

              <button
                disabled={user.kyc?.hasPaidFee || user.walletBalance < 15 || actionLoading === 'kycfee'}
                onClick={handlePayKYCFee}
                className={`w-full py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-extrabold transition flex items-center justify-center gap-2 ${
                  user.kyc?.hasPaidFee
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 cursor-not-allowed'
                    : user.walletBalance >= 15
                    ? 'bg-[#D4AF37] text-black hover:brightness-110 active:scale-95'
                    : 'bg-white/[0.02] text-gray-500 border border-white/[0.05] cursor-not-allowed'
                }`}
              >
                {actionLoading === 'kycfee' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : user.kyc?.hasPaidFee ? (
                  'Fee Verified Paid ✓'
                ) : user.walletBalance >= 15 ? (
                  'Authorize $15 Payment'
                ) : (
                  'Insufficient Balance'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── SUPPORT TAB ── */}
        {activeTab === 'support' && (
          <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* New Ticket */}
            <div className="lg:col-span-5 bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div>
                <span className="text-[#C5A059] font-mono text-xs uppercase block">
                  Client Care Service Desk
                </span>
                <h3 className="text-base font-bold text-white">Create Support Ticket</h3>
                <p className="text-xs text-gray-400">24/7/365 customer relations.</p>
              </div>

              <form onSubmit={handleOpenTicketSubmit} className="space-y-4">
                <div>
                  <label className="text-[9.5px] font-mono text-gray-500 uppercase block mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Inquiry or Transaction Delay"
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <div>
                  <label className="text-[9.5px] font-mono text-gray-500 uppercase block mb-1.5">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  >
                    <option value="Finance">Finance / Deposit Verification</option>
                    <option value="Technical Support">Technical Issues / Account Unlock</option>
                    <option value="Compliance">KYC Compliance</option>
                    <option value="Partner Matching">Referral Commissions</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] font-mono text-gray-500 uppercase block mb-1.5 font-bold">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Provide specific details about your issue..."
                    className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading === 'ticket'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] font-bold text-xs uppercase tracking-widest text-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading === 'ticket' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Submit Support Ticket'
                  )}
                </button>
              </form>
            </div>

            {/* Ticket Threads */}
            <div className="lg:col-span-7 bg-[#111112] p-6 rounded-3xl border border-white/[0.04] space-y-6">
              <div>
                <h3 className="text-base font-bold">My Support Tickets ({tickets.length})</h3>
                <p className="text-xs text-gray-400">Select a ticket to view the thread.</p>
              </div>

              {tickets.length === 0 ? (
                <div className="p-12 text-center text-gray-500 rounded-2xl bg-[#0A0A0B]/60">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-25" />
                  <p className="text-xs mt-3">No open support requests logged yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-12 gap-4 h-[420px]">
                  {/* Ticket List */}
                  <div className="sm:col-span-5 space-y-2.5 overflow-y-auto max-h-[400px]">
                    {tickets.map((tck) => (
                      <button
                        key={tck.id}
                        onClick={() => setSelectedTicketId(tck.id)}
                        className={`w-full p-3 text-left rounded-xl border transition flex flex-col ${
                          selectedTicketId === tck.id
                            ? 'bg-[#1C170E] border-[#D4AF37]'
                            : 'bg-[#0E0E0F] border-white/[0.04] hover:bg-white/[0.01]'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[9.5px] font-mono text-gray-500">{tck.id}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${
                              tck.status === 'open'
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                                : 'bg-green-950 text-green-400'
                            }`}
                          >
                            {tck.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">
                          {tck.subject}
                        </h4>
                        <span className="text-[9px] text-gray-500 font-mono mt-2">
                          {tck.category}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Chat Thread */}
                  <div className="sm:col-span-7 bg-[#0C0C0D] p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-between h-[400px]">
                    {selectedTicketId ? (
                      (() => {
                        const activeTicket = tickets.find((t) => t.id === selectedTicketId);
                        if (!activeTicket) return null;
                        return (
                          <div className="flex flex-col justify-between h-full">
                            <div className="border-b border-white/[0.03] pb-2 mb-3">
                              <h4 className="text-xs font-bold text-white">{activeTicket.subject}</h4>
                              <span className="text-[9px] text-gray-400 font-mono block mt-0.5">
                                {activeTicket.category}
                              </span>
                            </div>

                            <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[250px] pr-1.5">
                              {activeTicket.messages.map((msg, mIdx) => (
                                <div
                                  key={mIdx}
                                  className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                                    msg.sender === 'user'
                                      ? 'bg-[#1C170E] border border-[#D4AF37]/20 text-white ml-auto'
                                      : 'bg-white/[0.05] text-gray-200 mr-auto'
                                  }`}
                                >
                                  <p>{msg.message}</p>
                                  <span className="block text-[8px] text-gray-500 mt-1 text-right font-mono">
                                    {msg.sender === 'user' ? 'Investor' : 'Support'} &bull;{' '}
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <form onSubmit={handleTicketReply} className="mt-3 flex gap-2">
                              <input
                                type="text"
                                required
                                value={ticketReplyText}
                                onChange={(e) => setTicketReplyText(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 bg-[#1A1A1C] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                              />
                              <button
                                type="submit"
                                disabled={actionLoading === 'reply'}
                                className="bg-[#D4AF37] hover:bg-[#8C6D23] text-black px-3.5 rounded-xl transition"
                              >
                                {actionLoading === 'reply' ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            </form>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 font-mono text-xs">
                        <MessageSquare className="w-8 h-8 opacity-25 mb-2" />
                        <span>Select a ticket to open the thread.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Receipt Invoice Modal ── */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#D4AF37]/30 max-w-2xl w-full rounded-3xl p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div id="receipt-invoice-printable" className="p-6 bg-white text-black rounded-2xl text-xs space-y-6 font-sans">
              <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold tracking-widest text-[#8C6D23]">
                    LEADSGLOBAL
                  </h2>
                  <p className="text-[10px] text-gray-400 font-mono font-bold">
                    Growing Capital, Building Future
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#8C6D23]/10 text-[#8C6D23] font-bold font-mono px-3 py-1 rounded text-[10px] uppercase">
                    OFFICIAL LEDGER INVOICE
                  </span>
                  <p className="text-[10px] text-gray-400 font-mono mt-1.5">
                    {new Date(viewingReceipt.date).toUTCString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-gray-600 leading-relaxed pt-2">
                <div>
                  <h4 className="text-[10px] uppercase font-mono text-gray-400">FROM:</h4>
                  <p className="font-bold text-black">LeadsGlobal Financial Audits LLC</p>
                  <p>120 London Wall, Barbican</p>
                  <p>EC2Y 5ET London, United Kingdom</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono text-gray-400">TO:</h4>
                  <p className="font-bold text-black">{viewingReceipt.userEmail}</p>
                  <p>
                    Investor ID: <code className="font-mono text-black">{viewingReceipt.userId}</code>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 font-mono text-[11px]">
                {[
                  ['Receipt Serial', viewingReceipt.receiptId],
                  ['TX Hash / Reference', viewingReceipt.txHash || viewingReceipt.bankDetails || 'INTERNAL'],
                  ['Operation Type', viewingReceipt.type.toUpperCase()],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b pb-2">
                    <span className="text-gray-400 font-sans">{label}:</span>
                    <strong className="text-black text-right break-all max-w-[200px]">{val}</strong>
                  </div>
                ))}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-sans text-sm font-bold text-gray-700">Total Amount:</span>
                  <span className="text-xl font-extrabold text-[#8C6D23]">
                    ${Math.abs(viewingReceipt.amount).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 font-mono tracking-wide leading-relaxed border-t border-gray-200 pt-4 text-center">
                Validated status:{' '}
                <strong className="text-emerald-700">{viewingReceipt.status.toUpperCase()}</strong>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download / Print</span>
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-3 px-4 bg-white/[0.04] text-gray-400 hover:text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}