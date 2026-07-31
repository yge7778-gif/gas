import React from 'react';
import { ArrowRight, ShieldCheck, Zap, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface HeroSectionProps {
  onStartRental: () => void;
  language: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartRental, language }) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Main Hero Banner */}
      <div className="bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border border-blue-100/60 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-xs">
        {/* Background glow graphics */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-100/80 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-blue-200">
            <Zap className="w-4 h-4 fill-current text-amber-500" />
            <span>{t('heroBadge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t('heroTitle')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t('heroDesc')}
          </p>

          <div className="pt-2 flex justify-center">
            <button
              onClick={onStartRental}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm sm:text-base shadow-lg hover:shadow-blue-500/25 transition transform active:scale-95 flex items-center space-x-2 cursor-pointer"
            >
              <span>{t('rentNow')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t('whyChooseTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('whyChooseSubtitle')}
            </p>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 rounded-2xl text-center shadow-sm shrink-0">
            <div className="text-[10px] font-medium tracking-wider uppercase opacity-90">{t('upToReduce')}</div>
            <div className="text-2xl font-black">90%</div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('saveUpTo90')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('saveDesc')}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('instantDelegation')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('delegationDesc')}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('secureAndFlexible')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('flexibleDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
