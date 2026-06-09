/**
 * LeadsGlobal — App.tsx
 * Wired to the real Supabase service (supabaseMock.ts).
 * Handles async session hydration on mount using onAuthStateChange.
 * Secret admin access via /#admin-x9k2m7 with private login.
 */

import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { Language } from './types';
import { supabase, dbService } from './supabaseMock';

type AppView = 'home' | 'auth' | 'dashboard' | 'admin' | 'privacy' | 'terms';

// ─── ADMIN CREDENTIALS ────────────────────────────────────────────────────────
const ADMIN_USERNAME = 'leadsglobal_admin';
const ADMIN_PASSWORD = 'kokoma@0818.LG@SuperAdmin2025!';
// ─────────────────────────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${remaining}s.`);
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('lg_admin_auth', 'true');
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockedUntil(Date.now() + 60000);
          setError('Too many failed attempts. Locked for 60 seconds.');
        } else {
          setError(`Invalid credentials. ${5 - newAttempts} attempt${5 - newAttempts === 1 ? '' : 's'} remaining.`);
        }
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/40 border border-red-500/20 mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-white font-mono uppercase tracking-widest">
            Admin Access Portal
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wider">
            LeadsGlobal &bull; Restricted Zone
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111112] border border-red-500/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 bg-red-950/50 border border-red-500/20 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-red-300 font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                Admin Username
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="off"
                  className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                Admin Password
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 00-9 0v3.5M5 10.5h14a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8a1 1 0 011-1z" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="off"
                  className="w-full bg-[#1A1A1C] border border-white/[0.06] rounded-xl py-3 pl-11 pr-11 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (!!lockedUntil && Date.now() < lockedUntil)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:brightness-110 active:scale-95 text-white font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          <p className="text-center text-[9px] font-mono text-gray-700 uppercase tracking-wider mt-6">
            Unauthorised access is strictly prohibited &bull; All attempts are logged
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [routePayload, setRoutePayload] = useState<any>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check for secret admin hash in URL
    if (window.location.hash === '#admin-x9k2m7') {
      if (sessionStorage.getItem('lg_admin_auth') === 'true') {
        setAdminAuthenticated(true);
        setCurrentView('admin');
        setIsHydrating(false);
      } else {
        setShowAdminLogin(true);
        setIsHydrating(false);
      }
      return;
    }

    // Normal user flow
    const savedLang = localStorage.getItem('lg_lang');
    if (savedLang && ['en', 'fr', 'es', 'pt', 'ar'].includes(savedLang)) {
      setCurrentLanguage(savedLang as Language);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            const profile = await dbService.getCurrentUser();
            if (profile) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('home');
            }
          } else {
            setCurrentView('home');
          }
          setIsHydrating(false);
        }

        if (event === 'SIGNED_IN' && currentView !== 'dashboard') {
          const profile = await dbService.getCurrentUser();
          if (profile) {
            setCurrentView('dashboard');
          }
        }

        if (event === 'SIGNED_OUT') {
          setCurrentView('home');
        }

        if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
          await supabase
            .from('profiles')
            .update({ is_email_verified: true })
            .eq('id', session.user.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('lg_lang', lang);
  };

  const handleNavigate = (view: AppView, payload: any = null) => {
    // Block normal users from ever reaching admin
    if (view === 'admin' && !adminAuthenticated) return;
    setCurrentView(view);
    setRoutePayload(payload);
  };

  // ── Show admin login screen ───────────────────────────────────────────────
  if (showAdminLogin && !adminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white">
        <AdminLogin
          onSuccess={() => {
            setAdminAuthenticated(true);
            setShowAdminLogin(false);
            setCurrentView('admin');
          }}
        />
      </div>
    );
  }

  // ── Loading screen ────────────────────────────────────────────────────────
  if (isHydrating || currentView === null) {
    return (
      <div className="min-h-screen bg-[#0C0C0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            Authenticating&hellip;
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white selection:bg-[#D4AF37] selection:text-black">
      {currentView === 'home' && (
        <Home
          onNavigate={handleNavigate}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {currentView === 'auth' && (
        <Auth
          onNavigate={handleNavigate}
          currentLanguage={currentLanguage}
          initialMode={routePayload?.mode || 'login'}
          preSelectedPlanId={routePayload?.planId}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          currentLanguage={currentLanguage}
        />
      )}

      {currentView === 'admin' && adminAuthenticated && (
        <AdminPanel
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'privacy' && (
        <PrivacyPolicy onNavigate={handleNavigate} />
      )}

      {currentView === 'terms' && (
        <TermsOfService onNavigate={handleNavigate} />
      )}
    </div>
  );
}