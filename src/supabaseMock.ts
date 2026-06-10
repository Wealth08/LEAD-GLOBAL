/**
 * LeadsGlobal — Production Supabase Service
 * Full image upload support via Supabase Storage.
 * Real-time announcements, support ticket messaging with images.
 * Admin can control all user dashboard fields.
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  UserProfile, Transaction, DailyTask, TaskLog,
  SupportTicket, LeaderboardEntry, BankAccount,
  InvestmentPlan, InvestmentPlanId, KYCData,
} from './types';import React, { useState } from 'react';
import { Mail, Phone, Globe, ShieldCheck, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';
import Logo from './Logo';
import { dbService } from '../supabaseMock';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface AuthProps {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'admin' | 'privacy' | 'terms', payload?: any) => void;
  currentLanguage: Language;
  initialMode?: 'login' | 'signup';
  preSelectedPlanId?: string;
}

const COUNTRIES = [
  { name: 'United Kingdom', code: '+44' },
  { name: 'United States', code: '+1' },
  { name: 'Spain', code: '+34' },
  { name: 'France', code: '+33' },
  { name: 'Portugal', code: '+351' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'Nigeria', code: '+234' },
  { name: 'Saudi Arabia', code: '+966' },
  { name: 'Argentina', code: '+54' },
  { name: 'Mexico', code: '+52' },
  { name: 'Brazil', code: '+55' },
  { name: 'India', code: '+91' },
  { name: 'Ghana', code: '+233' },
  { name: 'South Africa', code: '+27' },
  { name: 'Kenya', code: '+254' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'Germany', code: '+49' },
  { name: 'Italy', code: '+39' },
  { name: 'Netherlands', code: '+31' },
];

// ── PasswordInput defined OUTSIDE Auth to prevent remount on every keystroke ──
interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}

function PasswordInput({ value, onChange, placeholder, show, onToggle }: PasswordInputProps) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-3 pl-11 pr-10 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition"
      />
      <span className="absolute left-3.5 top-3.5 text-gray-500 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 00-9 0v3.5M5 10.5h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z" />
        </svg>
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Safe message extractor — prevents objects rendering as {} ─────────────────
function safeMsg(val: unknown, fallback: string): string {
  if (typeof val === 'string' && val.trim() !== '') return val;
  if (val && typeof val === 'object') {
    const v = val as any;
    if (typeof v.message === 'string') return v.message;
    if (typeof v.msg === 'string') return v.msg;
    if (typeof v.error === 'string') return v.error;
    const s = JSON.stringify(v);
    return s !== '{}' ? s : fallback;
  }
  return fallback;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Auth({
  onNavigate,
  currentLanguage,
  initialMode = 'login',
  preSelectedPlanId,
}: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0].name);
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isRTL = currentLanguage === 'ar';

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setReferralCode('');
    setFeedback(null);
  };

  const inputClass =
    'w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition';

  const feedbackColors = {
    success: 'bg-[#1C1A12] border border-[#D4AF37]/30 text-[#D4AF37]',
    error:   'bg-[#1A0F0F] border border-red-500/30 text-red-400',
    info:    'bg-[#0F1A1C] border border-blue-500/30 text-blue-400',
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFeedback({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await dbService.login(email, password);
      if (res.success) {
        onNavigate('dashboard', { welcome: true });
      } else {
        setFeedback({ type: 'error', text: safeMsg(res.message, 'Login failed. Please check your credentials.') });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: safeMsg(err.message ?? err, 'An unexpected error occurred.') });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFeedback({ type: 'error', text: 'Email and password are required.' });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 8) {
      setFeedback({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await dbService.signup(email, password, phone, country, referralCode || undefined);
      if (res.success) {
        setFeedback({ type: 'success', text: safeMsg(res.message, 'Account created! Please check your email to verify.') });
        setTimeout(() => setMode('login'), 4000);
      } else {
        setFeedback({ type: 'error', text: safeMsg(res.message, 'Signup failed. Please try again.') });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: safeMsg(err.message ?? err, 'An unexpected error occurred.') });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFeedback({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await dbService.sendPasswordReset(email);
      setFeedback({ type: res.success ? 'success' : 'error', text: safeMsg(res.message, 'If that email exists, a reset link has been sent.') });
    } catch (err: any) {
      setFeedback({ type: 'error', text: safeMsg(err.message ?? err, 'An unexpected error occurred.') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-view"
      className="min-h-screen bg-[#0A0A0B] text-white flex flex-col justify-between py-12 px-4 font-sans selection:bg-[#D4AF37] selection:text-black relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back button */}
      <div className="absolute top-12 left-12">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#D4AF37] transition font-mono uppercase tracking-widest pl-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full pt-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="justify-center" />
          <p className="text-xs text-[#C5A059] font-mono uppercase tracking-widest mt-3">
            Fintech Security Vault
          </p>
        </div>

        <div className="liquid-glass p-8 rounded-3xl shadow-2xl w-full relative overflow-hidden backdrop-blur-3xl">
          {/* Gold accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#8C6D23]" />

          {/* Feedback banner */}
          {feedback && (
            <div className={`mb-6 p-4 rounded-xl text-xs ${feedbackColors[feedback.type]}`}>
              <p className="font-mono font-semibold">{feedback.text}</p>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display tracking-tight text-white text-glow">
                  Welcome Back
                </h3>
                <p className="text-xs text-gray-400">Sign in to your investor account.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  show={showPassword}
                  onToggle={() => setShowPassword((p) => !p)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:brightness-110 active:scale-95 text-black font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>

              <div className="flex justify-between text-xs font-mono text-gray-500 pt-3 border-t border-white/[0.03]">
                <button type="button" onClick={() => { resetFields(); setMode('signup'); }} className="hover:text-white transition">
                  Create Account
                </button>
                <button type="button" onClick={() => { resetFields(); setMode('forgot'); }} className="hover:text-white transition">
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          {/* ── SIGNUP ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display tracking-tight text-white text-glow">
                  Create Account
                </h3>
                <p className="text-xs text-gray-400">
                  Set up your investor profile. All accounts start with a $0 balance.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-3.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition appearance-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Min. 8 characters"
                  show={showPassword}
                  onToggle={() => setShowPassword((p) => !p)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter password"
                  show={showConfirm}
                  onToggle={() => setShowConfirm((p) => !p)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 20 7946 0958"
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C5A059] pointer-events-none" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. GOLDEN_LION"
                      className="w-full bg-[#1E190F] border border-[#D4AF37]/20 rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-[#D4AF37] placeholder-[#8C6D23]/50 focus:outline-none focus:border-[#D4AF37] transition uppercase"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:brightness-110 active:scale-95 text-black font-bold text-xs uppercase tracking-widest transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>

              <div className="flex justify-between text-xs font-mono text-gray-500 pt-3 border-t border-white/[0.03]">
                <button type="button" onClick={() => { resetFields(); setMode('login'); }} className="hover:text-white transition">
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display tracking-tight text-white text-glow">
                  Reset Password
                </h3>
                <p className="text-xs text-gray-400">
                  Enter your email and we'll send a reset link to your inbox.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8C6D23] hover:brightness-110 active:scale-95 text-black font-bold text-xs uppercase tracking-widest transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>

              <div className="flex justify-between text-xs font-mono text-gray-500 pt-3 border-t border-white/[0.03]">
                <button type="button" onClick={() => { resetFields(); setMode('login'); }} className="hover:text-white transition">
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="text-center text-[10px] text-gray-600 font-mono tracking-wider mt-12 pb-2">
        PLATFORM HOSTED UNDER GLOBAL ENCRYPTED SANDBOX &bull; SECURE MULTILATERAL AGREEMENT
      </footer>
    </div>
  );
}

const SUPABASE_URL = 'https://jcufueffwgkgxrzssiyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9KxfFUZyqjb_DEHzWVSzLg_OgPvPbWw';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

// ─── Investment Plans ─────────────────────────────────────────────────────────
export const PLANS: Record<InvestmentPlanId, InvestmentPlan> = {
  regular:  { id: 'regular',  name: 'Regular Plan',  price: 30,  dailyEarning: 1, description: 'Earn $1 daily Mon–Fri. Withdrawal unlocks after $30 in plan earnings.' },
  gold:     { id: 'gold',     name: 'Gold Plan',     price: 60,  dailyEarning: 2, description: 'Earn $2 daily Mon–Fri. Withdrawal unlocks after $60 in plan earnings.' },
  titanium: { id: 'titanium', name: 'Titanium Plan', price: 120, dailyEarning: 4, description: 'Earn $4 daily Mon–Fri. Withdrawal unlocks after $120 in plan earnings.' },
  platinum: { id: 'platinum', name: 'Platinum Plan', price: 240, dailyEarning: 8, description: 'Earn $8 daily Mon–Fri. Withdrawal unlocks after $240 in plan earnings.' },
};

export const DEFAULT_TASKS: DailyTask[] = [
  { id: 'task-checkin',  title: 'Daily Platform Check-in',                    category: 'checkin', reward: 0.5, instructions: 'Click daily check-in to earn $0.50 instantly.' },
  { id: 'task-telegram', title: 'Join LeadsGlobal Official Telegram Group',    category: 'social',  reward: 1.0, instructions: 'Join our Telegram channel. Upload screenshot as proof.', link: 'https://t.me/leadsglobal_official_channel' },
  { id: 'task-twitter',  title: 'Share LeadsGlobal Certificate on Twitter / X', category: 'promo',   reward: 2.0, instructions: 'Tweet with #LeadsGlobal. Upload screenshot as proof.', link: 'https://twitter.com/intent/tweet?text=LeadsGlobal%20Investment' },
  { id: 'task-whatsapp', title: 'Post LeadsGlobal Status on WhatsApp',         category: 'promo',   reward: 1.5, instructions: 'Post our banner as WhatsApp status. Upload screenshot as proof.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

function rowToProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id, email: row.email,
    isEmailVerified: row.is_email_verified ?? false,
    phone: row.phone ?? '', country: row.country ?? '',
    timezone: row.timezone ?? 'UTC', createdAt: row.created_at,
    referralCode: row.referral_code ?? '',
    referredByCode: row.referred_by_code ?? undefined,
    status: row.status ?? 'Pending Verification',
    kycStatus: row.kyc_status ?? 'None',
    kyc: row.kyc_data ?? undefined,
    walletBalance: Number(row.wallet_balance ?? 0),
    totalDeposited: Number(row.total_deposited ?? 0),
    pendingDeposited: Number(row.pending_deposited ?? 0),
    dailyEarningsAccumulated: Number(row.daily_earnings_accumulated ?? 0),
    referralEarningsAccumulated: Number(row.referral_earnings_accumulated ?? 0),
    withdrawnAmount: Number(row.withdrawn_amount ?? 0),
    activePlanId: row.active_plan_id ?? undefined,
    planActivatedAt: row.plan_activated_at ?? undefined,
    planAccumulatedEarnings: Number(row.plan_accumulated_earnings ?? 0),
    telegramHandle: row.telegram_handle ?? undefined,
    whatsappNumber: row.whatsapp_number ?? undefined,
    notificationsEnabled: row.notifications_enabled ?? { telegram: true, whatsapp: true, email: true },
    // Admin-editable dashboard fields
    customNotice: row.custom_notice ?? undefined,
    withdrawalAddress: row.withdrawal_address ?? undefined,
  };
}

function rowToTransaction(row: Record<string, any>): Transaction {
  return {
    id: row.id, userId: row.user_id, userEmail: row.user_email,
    type: row.type, amount: Number(row.amount), status: row.status,
    date: row.date, txHash: row.tx_hash ?? undefined,
    proofUrl: row.proof_url ?? undefined, receiptId: row.receipt_id ?? '',
    bankDetails: row.bank_details ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

// ─── Image Upload to Supabase Storage ────────────────────────────────────────
export async function uploadImage(
  file: File,
  bucket: 'deposits' | 'kyc' | 'tasks' | 'support'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${generateId()}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) return { url: null, error: error.message };

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: urlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message };
  }
}

// ─── SupabaseService ──────────────────────────────────────────────────────────
export class SupabaseService {
  private _cachedUser: UserProfile | null = null;
  private _authUser: User | null = null;

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      this._authUser = session?.user ?? null;
      if (!session) this._cachedUser = null;
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async signup(email: string, password: string, phone: string, country: string, referralCodeUsed?: string) {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail, password,
        options: { emailRedirectTo: `${window.location.origin}`, data: { phone, country, referred_by_code: referralCodeUsed?.trim().toUpperCase() || null } },
      });
      if (error) return { success: false, message: error.message };
      if (!data.user) return { success: false, message: 'Signup failed.' };

      const referralCode = trimmedEmail.split('@')[0].toUpperCase() + '_' + Math.floor(100 + Math.random() * 900);
      const { data: profileData } = await supabase.from('profiles').upsert({
        id: data.user.id, email: trimmedEmail, phone: phone || null, country: country || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        referral_code: referralCode,
        referred_by_code: referralCodeUsed?.trim().toUpperCase() || null,
        status: 'Pending Verification', kyc_status: 'None',
        wallet_balance: 0, total_deposited: 0, pending_deposited: 0,
        daily_earnings_accumulated: 0, referral_earnings_accumulated: 0,
        withdrawn_amount: 0, plan_accumulated_earnings: 0,
        is_email_verified: false,
        notifications_enabled: { telegram: true, whatsapp: true, email: true },
      }).select().single();

      await this._logActivity(data.user.id, 'USER_REGISTERED', `New account: ${trimmedEmail}`);
      const profile = profileData ? rowToProfile(profileData) : null;
      this._cachedUser = profile;
      return { success: true, message: 'Account created! Check your email to verify.', user: profile ?? undefined };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return { success: false, message: error.message.includes('invalid') ? 'Invalid email or password.' : error.message };
      if (!data.user) return { success: false, message: 'Login failed.' };

      this._authUser = data.user;
      const profile = await this._fetchProfile(data.user.id);
      if (!profile) return { success: false, message: 'Profile not found. Contact support.' };
      if (profile.status === 'Banned') { await supabase.auth.signOut(); return { success: false, message: 'Account suspended.' }; }

      this._cachedUser = profile;
      await this._logActivity(data.user.id, 'USER_LOGIN', `Login: ${profile.email}`);
      return { success: true, message: 'Logged in.', user: profile };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async logout() {
    this._cachedUser = null; this._authUser = null;
    await supabase.auth.signOut();
  }

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
    return error ? { success: false, message: error.message } : { success: true, message: 'Reset link sent.' };
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (this._cachedUser) return this._cachedUser;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    this._authUser = user;
    const profile = await this._fetchProfile(user.id);
    this._cachedUser = profile;
    return profile;
  }

  getCurrentUserSync(): UserProfile | null { return this._cachedUser; }

  // ── Profile ───────────────────────────────────────────────────────────────
  async getUserById(id: string) { return this._fetchProfile(id); }

  async getAllUsers(): Promise<UserProfile[]> {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    return (data ?? []).map(rowToProfile);
  }

  async updateNotificationSettings(telegramHandle: string, whatsappNumber: string, preferences: { telegram: boolean; whatsapp: boolean; email: boolean }) {
    const user = await this.getCurrentUser();
    if (!user) return;
    await supabase.from('profiles').update({ telegram_handle: telegramHandle || null, whatsapp_number: whatsappNumber || null, notifications_enabled: preferences }).eq('id', user.id);
    this._cachedUser = null;
  }

  // ── Announcements — real-time ─────────────────────────────────────────────
  async getAnnouncements(): Promise<{ id: string; text: string; imageUrl?: string; date: string }[]> {
    const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false }).limit(20);
    return (data ?? []).map(r => ({ id: r.id, text: r.text, imageUrl: r.image_url ?? undefined, date: r.date }));
  }

  subscribeToAnnouncements(callback: (ann: { id: string; text: string; imageUrl?: string; date: string }) => void) {
    return supabase.channel('announcements-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        const r = payload.new as any;
        callback({ id: r.id, text: r.text, imageUrl: r.image_url ?? undefined, date: r.date });
      })
      .subscribe();
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────
  async getBankAccounts(): Promise<BankAccount[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];
    const { data } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id).order('is_preferred', { ascending: false });
    return (data ?? []).map(r => ({ id: r.id, bankName: r.bank_name, accountName: r.account_name, accountNumber: r.account_number, swiftCode: r.swift_code ?? '', iban: r.iban ?? undefined, country: r.country, currency: r.currency, isPreferred: r.is_preferred }));
  }

  async addBankAccount(account: Omit<BankAccount, 'id'>) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized.' };
    if (account.isPreferred) await supabase.from('bank_accounts').update({ is_preferred: false }).eq('user_id', user.id);
    const { error } = await supabase.from('bank_accounts').insert({ id: 'bnk-' + generateId(), user_id: user.id, bank_name: account.bankName, account_name: account.accountName, account_number: account.accountNumber, swift_code: account.swiftCode ?? null, iban: account.iban ?? null, country: account.country, currency: account.currency, is_preferred: account.isPreferred });
    if (error) return { success: false, message: error.message };
    await this._logActivity(user.id, 'BANK_ADDED', `Bank added: ${account.bankName}`);
    return { success: true, message: 'Bank account added.' };
  }

  async deleteBankAccount(id: string) {
    const user = await this.getCurrentUser();
    if (!user) return;
    await supabase.from('bank_accounts').delete().eq('id', id).eq('user_id', user.id);
  }

  // ── KYC ───────────────────────────────────────────────────────────────────
  async submitKYC(formData: Omit<KYCData, 'status' | 'submittedAt' | 'hasPaidFee'>) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    const kycData: KYCData = { ...formData, status: 'Pending', submittedAt: new Date().toISOString(), hasPaidFee: user.kyc?.hasPaidFee || false };
    const { error } = await supabase.from('profiles').update({ kyc_data: kycData, kyc_status: 'Pending' }).eq('id', user.id);
    if (error) return { success: false, message: error.message };
    this._cachedUser = null;
    await this._logActivity(user.id, 'KYC_SUBMITTED', `KYC submitted: ${user.email}`);
    return { success: true, message: 'KYC submitted. Review within 24 hours.' };
  }

  async payKYCFee() {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    if (!user.kyc) return { success: false, message: 'Submit KYC documents first.' };
    const fee = 15;
    if (user.walletBalance < fee) return { success: false, message: `Insufficient balance. Fee: $${fee}` };
    const { error } = await supabase.from('profiles').update({ wallet_balance: user.walletBalance - fee, kyc_data: { ...user.kyc, hasPaidFee: true } }).eq('id', user.id);
    if (error) return { success: false, message: error.message };
    await supabase.from('transactions').insert({ id: 'TXN-FEE-' + generateId(), user_id: user.id, user_email: user.email, type: 'kyc_fee', amount: fee, status: 'approved', date: new Date().toISOString(), receipt_id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` });
    this._cachedUser = null;
    return { success: true, message: 'KYC fee paid successfully.' };
  }

  // ── Deposits ──────────────────────────────────────────────────────────────
  async submitDeposit(amount: number, txHash?: string, proofUrl?: string) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify your email first.' };
    const receiptId = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = 'TXN-' + Math.floor(100000 + Math.random() * 900000).toString();
    const { error } = await supabase.from('transactions').insert({ id: txId, user_id: user.id, user_email: user.email, type: 'deposit', amount, status: 'pending', date: new Date().toISOString(), tx_hash: txHash?.trim() || null, proof_url: proofUrl || null, receipt_id: receiptId });
    if (error) return { success: false, message: error.message };
    await supabase.from('profiles').update({ pending_deposited: user.pendingDeposited + amount }).eq('id', user.id);
    this._cachedUser = null;
    await this._logActivity(user.id, 'DEPOSIT_REQUEST', `Deposit $${amount} submitted`);
    return { success: true, message: 'Deposit proof submitted. Auditors will verify within 1–2 hours.', transaction: { id: txId, userId: user.id, userEmail: user.email, type: 'deposit' as const, amount, status: 'pending' as const, date: new Date().toISOString(), txHash, proofUrl, receiptId } };
  }

  // ── Plans ─────────────────────────────────────────────────────────────────
  async purchaseInvestmentPlan(planId: InvestmentPlanId) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify email first.' };
    if (user.status === 'Pending Verification') return { success: false, message: 'Verify deposit first.' };
    const plan = PLANS[planId];
    if (user.walletBalance < plan.price) return { success: false, message: `Insufficient balance. Required: $${plan.price}` };
    const { error } = await supabase.from('profiles').update({ wallet_balance: user.walletBalance - plan.price, active_plan_id: planId, plan_activated_at: new Date().toISOString(), plan_accumulated_earnings: 0 }).eq('id', user.id);
    if (error) return { success: false, message: error.message };
    this._cachedUser = null;
    await this._logActivity(user.id, 'PLAN_ACTIVATED', `Plan ${plan.name} activated`);
    return { success: true, message: `${plan.name} activated! Daily returns start now.` };
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────
  async submitTaskProof(taskId: string, proofText?: string, proofImageUrl?: string) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify email first.' };
    if (user.status === 'Pending Verification') return { success: false, message: 'Complete deposit verification first.' };
    const task = DEFAULT_TASKS.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found.' };
    const { data: existingLogs } = await supabase.from('task_logs').select('id, status, submitted_at').eq('user_id', user.id).eq('task_id', taskId);
    if ((existingLogs ?? []).some((l: any) => l.status === 'pending')) return { success: false, message: 'Already pending review.' };
    if (task.category === 'checkin') {
      const today = new Date().toDateString();
      if ((existingLogs ?? []).some((l: any) => new Date(l.submitted_at).toDateString() === today && l.status === 'approved')) return { success: false, message: 'Already checked in today.' };
      await supabase.from('task_logs').insert({ id: 'LOG-' + generateId(), user_id: user.id, task_id: task.id, task_title: task.title, submitted_at: new Date().toISOString(), status: 'approved', proof: 'Daily Attendance', proof_image_url: null });
      await supabase.from('profiles').update({ wallet_balance: user.walletBalance + task.reward }).eq('id', user.id);
      this._cachedUser = null;
      return { success: true, message: `Check-in done! +$${task.reward} credited.` };
    }
    await supabase.from('task_logs').insert({ id: 'LOG-' + generateId(), user_id: user.id, task_id: task.id, task_title: task.title, submitted_at: new Date().toISOString(), status: 'pending', proof: proofText || '', proof_image_url: proofImageUrl || null });
    return { success: true, message: 'Task submitted for review.' };
  }

  // ── Withdrawals ───────────────────────────────────────────────────────────
  async submitWithdrawal(amount: number, bankAccountId: string) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    if (!user.isEmailVerified) return { success: false, message: 'Verify email first.' };
    if (user.status === 'Pending Verification') return { success: false, message: 'Account not verified.' };
    if (!user.activePlanId) return { success: false, message: 'No active plan.' };
    const plan = PLANS[user.activePlanId];
    if (user.planAccumulatedEarnings < plan.price) return { success: false, message: `Earnings must reach $${plan.price} before withdrawal.` };
    if (user.kycStatus !== 'Approved') return { success: false, message: 'KYC required.' };
    if (!user.kyc?.hasPaidFee) return { success: false, message: 'Pay KYC fee first.' };
    if (user.walletBalance < amount) return { success: false, message: `Insufficient balance.` };
    const accounts = await this.getBankAccounts();
    const bnk = accounts.find(a => a.id === bankAccountId);
    if (!bnk) return { success: false, message: 'Bank account not found.' };
    const receiptId = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = 'TXN-' + Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('profiles').update({ wallet_balance: user.walletBalance - amount }).eq('id', user.id);
    await supabase.from('transactions').insert({ id: txId, user_id: user.id, user_email: user.email, type: 'withdrawal', amount, status: 'pending', date: new Date().toISOString(), bank_details: `${bnk.bankName} - ${bnk.accountName} (${bnk.accountNumber})`, receipt_id: receiptId });
    this._cachedUser = null;
    return { success: true, message: 'Withdrawal submitted. Funds transferred once authorised.' };
  }

  // ── Support Tickets ───────────────────────────────────────────────────────
  async openSupportTicket(subject: string, category: string, firstMessage: string, imageUrl?: string) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Session expired.' };
    const ticketId = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
    const { error } = await supabase.from('support_tickets').insert({
      id: ticketId, user_id: user.id, user_email: user.email,
      subject, category, status: 'open', created_at: new Date().toISOString(),
      messages: [{ sender: 'user', message: firstMessage, imageUrl: imageUrl || null, timestamp: new Date().toISOString() }],
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Ticket submitted. Our agents will respond shortly.' };
  }

  async replyToTicket(ticketId: string, message: string, sender: 'user' | 'admin', imageUrl?: string) {
    const { data, error } = await supabase.from('support_tickets').select('messages').eq('id', ticketId).single();
    if (error || !data) return { success: false, message: 'Ticket not found.' };
    const updatedMessages = [...(data.messages || []), { sender, message, imageUrl: imageUrl || null, timestamp: new Date().toISOString() }];
    const { error: updateError } = await supabase.from('support_tickets').update({ messages: updatedMessages }).eq('id', ticketId);
    if (updateError) return { success: false, message: updateError.message };
    return { success: true, message: 'Reply sent.' };
  }

  subscribeToTicket(ticketId: string, callback: (messages: any[]) => void) {
    return supabase.channel(`ticket-${ticketId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${ticketId}` }, (payload) => {
        callback((payload.new as any).messages || []);
      })
      .subscribe();
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  async getCurrentUserTransactions(): Promise<Transaction[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    return (data ?? []).map(rowToTransaction);
  }

  async getCurrentUserTickets(): Promise<SupportTicket[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    return (data ?? []).map(r => ({ id: r.id, userId: r.user_id, userEmail: r.user_email, subject: r.subject, category: r.category, status: r.status, createdAt: r.created_at, messages: r.messages ?? [] }));
  }

  async getCurrentUserTaskLogs(): Promise<TaskLog[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];
    const { data } = await supabase.from('task_logs').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false });
    return (data ?? []).map(r => ({ id: r.id, userId: r.user_id, taskId: r.task_id, taskTitle: r.task_title, submittedAt: r.submitted_at, status: r.status, proof: r.proof ?? '', proofImageUrl: r.proof_image_url ?? undefined }));
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data } = await supabase.from('profiles').select('id, email, referral_code, referral_earnings_accumulated').neq('email', 'admin@leadsglobal.com').order('referral_earnings_accumulated', { ascending: false });
    return await Promise.all((data ?? []).map(async (u, index) => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by_code', u.referral_code);
      return { userId: u.id, email: u.email, referralCount: count ?? 0, totalReferralEarnings: Number(u.referral_earnings_accumulated ?? 0), rank: index + 1 };
    }));
  }

  async getSystemLogs() {
    const { data } = await supabase.from('system_logs').select('*').order('date', { ascending: false }).limit(200);
    return data ?? [];
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  async getAllTransactions(): Promise<Transaction[]> {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    return (data ?? []).map(rowToTransaction);
  }

  async getAllTaskLogs(): Promise<TaskLog[]> {
    const { data } = await supabase.from('task_logs').select('*').order('submitted_at', { ascending: false });
    return (data ?? []).map(r => ({ id: r.id, userId: r.user_id, taskId: r.task_id, taskTitle: r.task_title, submittedAt: r.submitted_at, status: r.status, proof: r.proof ?? '', proofImageUrl: r.proof_image_url ?? undefined }));
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(r => ({ id: r.id, userId: r.user_id, userEmail: r.user_email, subject: r.subject, category: r.category, status: r.status, createdAt: r.created_at, messages: r.messages ?? [] }));
  }

  async closeTicket(ticketId: string) {
    await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
    return { success: true, message: 'Ticket closed.' };
  }

  async adminApproveDeposit(txId: string) {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx || tx.type !== 'deposit' || tx.status !== 'pending') return { success: false, message: 'Invalid transaction.' };
    const { data: p } = await supabase.from('profiles').select('*').eq('id', tx.user_id).single();
    if (!p) return { success: false, message: 'User not found.' };
    const user = rowToProfile(p);
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);
    await supabase.from('profiles').update({ status: 'Active', wallet_balance: user.walletBalance + tx.amount, total_deposited: user.totalDeposited + tx.amount, pending_deposited: Math.max(0, user.pendingDeposited - tx.amount) }).eq('id', user.id);
    if (user.referredByCode) {
      const { data: sponsor } = await supabase.from('profiles').select('*').eq('referral_code', user.referredByCode).single();
      if (sponsor && sponsor.status === 'Active') {
        const bonus = tx.amount * 0.10;
        await supabase.from('profiles').update({ wallet_balance: Number(sponsor.wallet_balance) + bonus, referral_earnings_accumulated: Number(sponsor.referral_earnings_accumulated) + bonus }).eq('id', sponsor.id);
        await supabase.from('transactions').insert({ id: 'TXN-REF-' + generateId(), user_id: sponsor.id, user_email: sponsor.email, type: 'referral_bonus', amount: bonus, status: 'approved', date: new Date().toISOString(), tx_hash: `REFERRAL_${user.email}`, receipt_id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` });
      }
    }
    await this._logActivity(tx.user_id, 'DEPOSIT_APPROVED', `Admin approved $${tx.amount} for ${user.email}`);
    return { success: true, message: `$${tx.amount} deposit approved.` };
  }

  async adminRejectDeposit(txId: string, reason: string) {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx || tx.status !== 'pending') return { success: false, message: 'Invalid.' };
    await supabase.from('transactions').update({ status: 'rejected', rejection_reason: reason }).eq('id', txId);
    const { data: p } = await supabase.from('profiles').select('pending_deposited').eq('id', tx.user_id).single();
    if (p) await supabase.from('profiles').update({ pending_deposited: Math.max(0, Number(p.pending_deposited) - tx.amount) }).eq('id', tx.user_id);
    return { success: true, message: 'Deposit rejected.' };
  }

  async adminApproveWithdrawal(txId: string) {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx || tx.type !== 'withdrawal' || tx.status !== 'pending') return { success: false, message: 'Invalid.' };
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);
    const { data: p } = await supabase.from('profiles').select('withdrawn_amount').eq('id', tx.user_id).single();
    if (p) await supabase.from('profiles').update({ withdrawn_amount: Number(p.withdrawn_amount) + tx.amount }).eq('id', tx.user_id);
    return { success: true, message: 'Withdrawal approved.' };
  }

  async adminRejectWithdrawal(txId: string, reason: string) {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (!tx || tx.type !== 'withdrawal' || tx.status !== 'pending') return { success: false, message: 'Invalid.' };
    await supabase.from('transactions').update({ status: 'rejected', rejection_reason: reason }).eq('id', txId);
    const { data: p } = await supabase.from('profiles').select('wallet_balance').eq('id', tx.user_id).single();
    if (p) await supabase.from('profiles').update({ wallet_balance: Number(p.wallet_balance) + tx.amount }).eq('id', tx.user_id);
    return { success: true, message: 'Withdrawal rejected. Funds refunded.' };
  }

  async adminApproveKYC(userId: string) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!p || !p.kyc_data) return { success: false, message: 'Not found.' };
    await supabase.from('profiles').update({ kyc_status: 'Approved', kyc_data: { ...p.kyc_data, status: 'Approved' } }).eq('id', userId);
    await this._logActivity(userId, 'KYC_APPROVED', `KYC approved: ${p.email}`);
    return { success: true, message: `KYC approved for ${p.email}` };
  }

  async adminRejectKYC(userId: string, reason: string) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!p) return { success: false, message: 'Not found.' };
    await supabase.from('profiles').update({ kyc_status: 'Rejected', kyc_data: { ...p.kyc_data, status: 'Rejected', rejectionReason: reason } }).eq('id', userId);
    return { success: true, message: 'KYC rejected.' };
  }

  // Full user control — admin can change any field
  async adminAdjustUserFields(
    userId: string,
    fields: {
      walletBalance?: number;
      isEmailVerified?: boolean;
      status?: 'Active' | 'Pending Verification' | 'Banned';
      activePlanId?: InvestmentPlanId | null;
      planAccumulatedEarnings?: number;
      dailyEarningsAccumulated?: number;
      referralEarningsAccumulated?: number;
      totalDeposited?: number;
      withdrawnAmount?: number;
      customNotice?: string;
      withdrawalAddress?: string;
    }
  ) {
    const { data: p } = await supabase.from('profiles').select('email').eq('id', userId).single();
    if (!p) return { success: false, message: 'User not found.' };
    const updatePayload: Record<string, any> = {};
    if (fields.walletBalance !== undefined) updatePayload.wallet_balance = fields.walletBalance;
    if (fields.isEmailVerified !== undefined) updatePayload.is_email_verified = fields.isEmailVerified;
    if (fields.status !== undefined) updatePayload.status = fields.status;
    if (fields.activePlanId !== undefined) updatePayload.active_plan_id = fields.activePlanId;
    if (fields.planAccumulatedEarnings !== undefined) updatePayload.plan_accumulated_earnings = fields.planAccumulatedEarnings;
    if (fields.dailyEarningsAccumulated !== undefined) updatePayload.daily_earnings_accumulated = fields.dailyEarningsAccumulated;
    if (fields.referralEarningsAccumulated !== undefined) updatePayload.referral_earnings_accumulated = fields.referralEarningsAccumulated;
    if (fields.totalDeposited !== undefined) updatePayload.total_deposited = fields.totalDeposited;
    if (fields.withdrawnAmount !== undefined) updatePayload.withdrawn_amount = fields.withdrawnAmount;
    if (fields.customNotice !== undefined) updatePayload.custom_notice = fields.customNotice;
    if (fields.withdrawalAddress !== undefined) updatePayload.withdrawal_address = fields.withdrawalAddress;
    await supabase.from('profiles').update(updatePayload).eq('id', userId);
    await this._logActivity(userId, 'ADMIN_ADJUSTED', `Admin adjusted fields for ${p.email}`);
    return { success: true, message: `Account updated for ${p.email}` };
  }

  async adminPostAnnouncement(text: string, imageUrl?: string) {
    await supabase.from('announcements').insert({ id: 'ANN-' + generateId(), text, image_url: imageUrl || null, date: new Date().toISOString() });
    await this._logActivity('system', 'ANNOUNCEMENT', `Broadcast: ${text.substring(0, 60)}`);
  }

  async adminApproveTaskLog(logId: string) {
    const { data: log } = await supabase.from('task_logs').select('*').eq('id', logId).single();
    if (!log || log.status !== 'pending') return { success: false, message: 'Not found.' };
    const task = DEFAULT_TASKS.find(t => t.id === log.task_id);
    if (!task) return { success: false, message: 'Task not found.' };
    await supabase.from('task_logs').update({ status: 'approved' }).eq('id', logId);
    const { data: p } = await supabase.from('profiles').select('wallet_balance, email').eq('id', log.user_id).single();
    if (p) await supabase.from('profiles').update({ wallet_balance: Number(p.wallet_balance) + task.reward }).eq('id', log.user_id);
    await this._logActivity(log.user_id, 'TASK_APPROVED', `Task approved: ${task.title}`);
    return { success: true, message: `Task approved. +$${task.reward}` };
  }

  async adminRejectTaskLog(logId: string) {
    const { error } = await supabase.from('task_logs').update({ status: 'rejected' }).eq('id', logId);
    return error ? { success: false, message: error.message } : { success: true, message: 'Task rejected.' };
  }

  async simulateWeekdaysPassage(daysToSimulate: number) {
    const allUsers = await this.getAllUsers();
    const activeInvestors = allUsers.filter(u => u.status === 'Active' && u.activePlanId && u.isEmailVerified);
    let creditTotal = 0;
    const logs: string[] = [];
    for (const user of activeInvestors) {
      if (!user.activePlanId) continue;
      const plan = PLANS[user.activePlanId];
      const totalEarned = plan.dailyEarning * daysToSimulate;
      await supabase.from('profiles').update({ wallet_balance: user.walletBalance + totalEarned, daily_earnings_accumulated: user.dailyEarningsAccumulated + totalEarned, plan_accumulated_earnings: user.planAccumulatedEarnings + totalEarned }).eq('id', user.id);
      creditTotal += totalEarned;
      logs.push(`+$${totalEarned} → ${user.email} (${plan.name} × ${daysToSimulate}d)`);
      if (user.referredByCode) {
        const sponsor = allUsers.find(s => s.referralCode === user.referredByCode);
        if (sponsor && sponsor.status === 'Active') {
          const refBonus = totalEarned * 0.10;
          await supabase.from('profiles').update({ wallet_balance: sponsor.walletBalance + refBonus, referral_earnings_accumulated: sponsor.referralEarningsAccumulated + refBonus }).eq('id', sponsor.id);
          logs.push(`Ref bonus +$${refBonus.toFixed(2)} → ${sponsor.email}`);
        }
      }
    }
    return { creditTotal, details: logs };
  }

  private async _fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return rowToProfile(data);
  }

  private async _logActivity(userId: string, action: string, details: string) {
    await supabase.from('system_logs').insert({ id: 'LOG-' + generateId(), user_id: userId !== 'system' ? userId : null, action, details, date: new Date().toISOString() });
  }
}

export const dbService = new SupabaseService();