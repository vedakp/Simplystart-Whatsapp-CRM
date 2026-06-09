import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { cn } from '../utils';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { path: '/', label: 'Overview', icon: Lucide.LayoutDashboard },
  { path: '/chats', label: 'Live Chats', icon: Lucide.MessageCircle },
  { path: '/orders', label: 'Orders', icon: Lucide.ShoppingCart },
  { path: '/leads', label: 'Leads Pipeline', icon: Lucide.Target },
  { path: '/campaigns', label: 'Campaigns', icon: Lucide.MessageSquareShare },
  { path: '/contacts', label: 'Contacts', icon: Lucide.Users },
  { path: '/notes', label: 'Notes', icon: Lucide.FileText },
  { path: '/settings', label: 'Settings', icon: Lucide.Settings2 },
];

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [wsStatus, setWsStatus] = useState(false);

  useEffect(() => {
    // Poll whatsapp status for header
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        const data = await res.json();
        setWsStatus(data.connected);
      } catch (err) {
        // ignore
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0b0d] overflow-hidden text-slate-700 dark:text-slate-300 font-sans transition-colors duration-200">
      {/* Mobile Sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-[#0a0b0d]/80 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 bg-white dark:bg-[#07080a] w-64 border-r border-slate-200 dark:border-white/5 z-50 transform transition-all duration-300 md:transform-none flex flex-col shadow-xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center">
            {/* Show company logo if uploaded to public/logo.png, otherwise fallback */}
            <img 
              src="/logo.png" 
              alt="SimplyStart" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="hidden items-center">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
                <path d="M 45 15 L 10 50 L 45 85 L 60 70 L 40 50 L 60 30 Z" fill="#ff6666" />
                <path d="M 40 30 L 60 50 L 40 70 L 55 85 L 90 50 L 55 15 Z" fill="#ff6666" />
              </svg>
              <div className="flex flex-col font-sans justify-center leading-[0.95] tracking-[0.1em]">
                 <span className="text-[17px] font-black text-[#151D2A] dark:text-white uppercase leading-none">Simply</span>
                 <span className="text-[17px] font-black text-[#151D2A] dark:text-white uppercase leading-none pb-[2px]">
                   Start<span className="text-[#ff6666] font-black ml-[2px]">&gt;</span>
                 </span>
              </div>
            </div>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <Lucide.X className="w-5 h-5 text-slate-400 hover:text-slate-900 dark:hover:text-white" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-slate-100 dark:bg-white/5 text-primary-600 dark:text-primary-400" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
              )}
            >
              <item.icon className="w-5 h-5 mr-3 opacity-90" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center space-x-3 bg-slate-100 dark:bg-primary-900/10 border border-slate-200 dark:border-primary-500/20 px-4 py-2 rounded-full">
            <div className={cn("w-2 h-2 rounded-full", wsStatus ? "bg-primary-500 dark:bg-primary-400" : "bg-rose-500")} />
            <span className={cn("text-xs font-medium tracking-wide uppercase", wsStatus ? "text-primary-600 dark:text-primary-400" : "text-rose-600 dark:text-rose-500")}>
              {wsStatus ? "WhatsApp Linked" : "Disconnected"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between bg-slate-50 dark:bg-[#0a0b0d] border-b border-slate-200 dark:border-white/5 px-6 md:px-10 transition-colors duration-200">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Lucide.Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold font-sans text-slate-900 dark:text-white tracking-tight capitalize">
                {location.pathname === '/' ? 'Console Overview' : location.pathname.substring(1).replace('-', ' ')}
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">Intelligence & Deployment Console</p>
            </div>
          </div>
          <div>
            <button
               onClick={toggleTheme}
               className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
               title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Lucide.Sun className="w-5 h-5" /> : <Lucide.Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
