import React, { useState } from 'react';
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
