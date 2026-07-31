import React, { useState } from 'react';
import { Coins, ShieldCheck, ArrowRight, TrendingUp, Lock } from 'lucide-react';
import { Language } from '../types';
import { formatNumber } from '../utils/tron';
import { getTranslation } from '../utils/i18n';

interface EnergySubleaseProps {
  language: Language;
}

export const EnergySublease: React.FC<EnergySubleaseProps> = ({ language }) => {
  const [stakeAmount, setStakeAmount] = useState<number>(10000);
  const [stakeDays, setStakeDays] = useState<number>(30);
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Estimated APY: ~18.5%
  const estimatedAnnualTrx = Math.round(stakeAmount * 0.185);
  const estimatedDailyTrx = Math.round((estimatedAnnualTrx / 365) * 100) / 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sublease Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('subleaseTitle')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('subleaseDesc')}
            </p>
          </div>
        </div>

        {/* Yield Calculator */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span>{t('yieldCalculator')}</span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {t('estApy')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-semibold mb-1.5">{t('stakeAmount')}</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Math.max(1000, parseInt(e.target.value) || 0))}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-semibold mb-1.5">{t('lockDuration')}</label>
              <select
                value={stakeDays}
                onChange={(e) => setStakeDays(parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value={30}>{t('flexibleReturn')}</option>
                <option value={90}>{t('extraBonus90')}</option>
                <option value={180}>{t('extraBonus180')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200/60">
            <div className="bg-white p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400">{t('estDailyYield')}</span>
              <div className="text-base font-extrabold text-blue-600 mt-0.5">{estimatedDailyTrx} TRX</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400">{t('estAnnualYield')}</span>
              <div className="text-base font-extrabold text-emerald-600 mt-0.5">+{formatNumber(estimatedAnnualTrx)} TRX</div>
            </div>
          </div>

          <button
            onClick={() => alert(`Submitted: ${formatNumber(stakeAmount)} TRX`)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{t('startSubleaseBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
