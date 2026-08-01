import React, { useState } from 'react';
import { Bolt, Menu, X, Globe, ChevronDown, Check, Wallet } from 'lucide-react';
import { WalletInfo, Language } from '../types';
import { shortenAddress } from '../utils/tron';
import { getTranslation } from '../utils/i18n';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wallet: WalletInfo;
  onOpenWalletModal: () => void;
  onDisconnectWallet: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  wallet,
  onOpenWalletModal,
  onDisconnectWallet,
  language,
  setLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const navItems = [
    { id: 'rental', label: t('navRental') },
    { id: 'home', label: t('navHome') },
    { id: 'sublease', label: t('navSublease') },
    { id: 'blog', label: t('navBlog') },
    { id: 'docs', label: t('navDocs') },
  ];

  const languages: { id: Language; label: string }[] = [
    { id: 'zh-CN', label: '简体中文' },
    { id: 'zh-TW', label: '繁體中文' },
    { id: 'en', label: 'English' },
  ];

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('rental')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Bolt className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Gas Station
            </span>
            <span className="text-[10px] tracking-wide text-slate-400 font-medium -mt-1 hidden sm:inline">
              {t('subTitle')}
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold bg-blue-50/70'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Language + Wallet */}
        <div className="flex items-center space-x-3">
          {/* Language Selector Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{languages.find((l) => l.id === language)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-36 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50 text-xs"
                onMouseLeave={() => setLangDropdownOpen(false)}
              >
                {languages.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setLanguage(l.id);
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between font-medium text-slate-700"
                  >
                    <span>{l.label}</span>
                    {language === l.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connect Wallet Button */}
          {wallet.connected && wallet.address ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenWalletModal}
                className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition hover:bg-blue-100 flex items-center space-x-1.5 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{shortenAddress(wallet.address, 4)}</span>
              </button>
              <button
                onClick={onDisconnectWallet}
                title={t('disconnect')}
                className="text-slate-400 hover:text-rose-600 p-2 text-xs font-medium"
              >
                {t('disconnect')}
              </button>
            </div>
          ) : (
            <button
              id="connectWalletBtn"
              onClick={onOpenWalletModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>{t('connectWallet')}</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-700 p-2 rounded-lg hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded-lg text-sm font-semibold ${
                activeTab === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3">
            <span className="text-xs text-slate-500 font-medium">Language / 语言</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
