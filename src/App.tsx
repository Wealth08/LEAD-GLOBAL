/**
 * LeadsGlobal — App.tsx
 * Wired to the real Supabase service (supabaseService.ts).
 * Handles async session hydration on mount using onAuthStateChange.
 */

import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { Language } from './types';
import { supabase, dbService } from './supabaseMock';

type AppView = 'home' | 'auth' | 'dashboard' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView | null>(null); // null = loading
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [routePayload, setRoutePayload] = useState<any>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // ── Hydrate session on mount ─────────────────────────────────────────────
  useEffect(() => {
    // 1. Restore saved language preference
    const savedLang = localStorage.getItem('lg_lang');
    if (savedLang && ['en', 'fr', 'es', 'pt', 'ar'].includes(savedLang)) {
      setCurrentLanguage(savedLang as Language);
    }

    // 2. Listen to Supabase auth state — fires immediately with the current
    //    session (INITIAL_SESSION) and again on any login/logout event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            // Fetch the full profile before deciding view
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

        // Handle magic-link / OAuth callback: user lands on app with a new session
        if (event === 'SIGNED_IN' && currentView !== 'dashboard') {
          const profile = await dbService.getCurrentUser();
          if (profile) {
            setCurrentView('dashboard');
          }
        }

        if (event === 'SIGNED_OUT') {
          setCurrentView('home');
        }

        // Email confirmed → mark verified in profiles table
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
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('lg_lang', lang);
  };

  const handleNavigate = (view: AppView, payload: any = null) => {
    setCurrentView(view);
    setRoutePayload(payload);
  };

  // ── Loading screen (prevents flash of wrong view) ────────────────────────
  if (isHydrating || currentView === null) {
    return (
      <div className="min-h-screen bg-[#0C0C0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Pulsing gold ring */}
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

      {currentView === 'admin' && (
        <AdminPanel
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}