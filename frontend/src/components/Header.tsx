import React, { useEffect, useState } from "react";
import { Sparkles, ArrowLeft, MoonStar, SunMedium, LayoutDashboard, Code2, Radar, BrainCircuit } from "lucide-react";
import { ViewType } from "../types";

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export default function Header({ currentView, onNavigate }: HeaderProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('flash-theme');
    return savedTheme ? savedTheme === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('flash-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    // Check backend health
    fetch(`${import.meta.env.VITE_BACKEND_URL}/health`)
      .then((res) => {
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  useEffect(() => {
    const updateScrolledState = () => setIsScrolled(window.scrollY > 16);
    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolledState);
  }, []);

  return (
    <header className={'flash-header sticky top-0 z-50 w-full transition-all duration-500 ' + (isScrolled ? 'flash-header--scrolled' : '')}>
      <nav className="relative flex h-[4.75rem] max-w-[90rem] mx-auto items-center justify-between px-5 sm:px-8 md:px-12">
        <div className="flex items-center gap-8">
          {currentView !== 'landing' ? (
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to FLASH</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Go to FLASH dashboard"
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Sparkles className="w-6 h-6 text-brand-indigo group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-sans text-xl font-black tracking-tighter text-white">
                FLASH
              </span>
            </button>
          )}
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 lg:flex">
          {[
            { view: 'landing' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
            { view: 'ats' as ViewType, label: 'Resume analysis', icon: Radar },
            { view: 'coding' as ViewType, label: 'Coding and DSA', icon: Code2 },
            { view: 'mock-setup' as ViewType, label: 'Mock interviews', icon: BrainCircuit },
          ].map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              title={label}
              aria-label={label}
              aria-current={currentView === view ? 'page' : undefined}
              className={'flex h-8 w-8 items-center justify-center rounded-full transition-all ' + (currentView === view ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:bg-white/5 hover:text-white')}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setIsDark((theme) => !theme)}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-pressed={!isDark}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="theme-toggle group relative flex h-9 w-[4.5rem] items-center rounded-full border border-white/10 p-1 shadow-lg transition-all duration-300 hover:border-brand-indigo/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo"
          >
            <span className={`theme-toggle-orb absolute top-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-300 ${isDark ? 'left-1' : 'left-9'}`}>
              {isDark ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
            </span>
            <span className={`absolute left-2.5 transition-all duration-300 ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} aria-hidden="true">
              <MoonStar className="h-3.5 w-3.5" />
            </span>
            <span className={`absolute right-2.5 transition-all duration-300 ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} aria-hidden="true">
              <SunMedium className="h-3.5 w-3.5" />
            </span>
          </button>

          <div className="flash-status flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
            <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : backendStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline text-gray-400 font-medium font-mono">
              {backendStatus === 'online' ? 'Backend Online' : backendStatus === 'offline' ? 'Backend Offline' : 'Connecting...'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full border border-brand-indigo/30 overflow-hidden ring-1 ring-white/10">
            <img 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              alt="User Avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbRlQB0xQSr3hQUY9AcQgJ0OQdXbTaM3H7ds92QcS8J5dyJujoF4fjGXlk2_na9nd03SESnAgX7l429V1uCyHW2gq8mj6c9Lb4qbwyTrM89Xs5-rMR9Y1t5F9FrZfhB3gDNIQC9DcRv6iOOGoxprOwv4iEkBCcAdyvpfAPCgs8G7S0OvlVmsQWxoTFC9_7n4k0gCNwSTSQOCKzBYWddDYxrAyIW7nLfebx3ejyTh-3oZGQr7nkJwAl" 
            />
          </div>
        </div>
      </nav>
    </header>
  );
}

