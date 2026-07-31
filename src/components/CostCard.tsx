import React from 'react';
import { ResourceType, PaymentMethod, WalletInfo, Language } from '../types';
import { formatNumber, calculateEnergyCost } from '../utils/tron';
import { Check, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface CostCardProps {
  resourceType: ResourceType;
  amount: number;
  durationMinutes: number;
  addressCount: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  wallet: WalletInfo;
  onPurchase: () => void;
  isSubmitting: boolean;
  language: Language;
}

export const CostCard: React.FC<CostCardProps> = ({
  resourceType,
  amount,
  durationMinutes,
  addressCount,
  paymentMethod,
  setPaymentMethod,
  wallet,
  onPurchase,
  isSubmitting,
  language,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Calculate cost metrics
  const costData = calculateEnergyCost(amount, durationMinutes, addressCount);

  // Format duration label for display
  const getDurationDisplay = (mins: number): string => {
    if (mins < 60) return `${mins} ${t('mins')}`;
    if (mins < 1440) return `${Math.round(mins / 60)} ${t('hours')}`;
    return `${Math.round(mins / 1440)} ${t('days')}`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 shadow-md text-white space-y-5 relative overflow-hidden">
      {/* Decorative subtle background lighting */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold tracking-wide flex items-center space-x-1.5">
          <span>{t('costInfo')}</span>
        </div>
        <div className="text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs text-blue-100 font-medium">
          {t('realtimeEstimate')}
        </div>
      </div>

      {/* Cost Itemization */}
      <div className="space-y-3 text-xs sm:text-sm font-medium border-b border-blue-400/30 pb-4">
        <div className="flex justify-between items-center">
          <span className="text-blue-100">{resourceType === 'energy' ? t('leasedEnergy') : t('leasedBandwidth')}</span>
          <span className="font-bold text-white">
            {formatNumber(amount)} {resourceType === 'energy' ? t('energy') : t('bandwidth')} ({t('perAddress')})
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-blue-100">{t('leaseDuration')}</span>
          <span className="font-bold text-white">{getDurationDisplay(durationMinutes)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-blue-100">{t('leaseAddresses')}</span>
          <span className="font-bold text-white">{addressCount}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-blue-100">{t('singleAddressFee')}</span>
          <div className="text-right">
            <span className="font-bold text-base text-white">
              {amount > 0 ? `${costData.singleAddressCost} TRX` : '0 TRX'}
            </span>
            <div className="text-[10px] text-blue-200 mt-0.5">
              {t('unitPrice')}: {costData.sunPerEnergy} SUN/{t('energy')} ({t('trxSavingsNode')} {costData.savingsPercentage}%)
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-blue-400/20">
          <span className="text-blue-100 font-semibold">{t('totalLeaseCost')}</span>
          <span className="font-bold text-base text-emerald-300">
            {costData.totalCost} TRX
          </span>
        </div>
      </div>

      {/* Pay Total & Payment Selection */}
      <div className="space-y-3 pt-0.5">
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-blue-100">{t('totalPaymentFee')}</span>
          <span className="text-xl sm:text-2xl text-emerald-300 font-black tracking-tight">
            {costData.totalCost} TRX
          </span>
        </div>

        {/* Balance Select Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPaymentMethod('wallet')}
            className={`p-3 rounded-xl text-left text-xs transition relative backdrop-blur-xs border cursor-pointer ${
              paymentMethod === 'wallet'
                ? 'bg-white/20 border-white text-white font-bold ring-2 ring-white/50'
                : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/15'
            }`}
          >
            <div className="text-blue-200 text-[11px]">{t('walletBalance')}</div>
            <div className="font-bold text-white mt-1 text-sm">
              {wallet.connected ? `${formatNumber(wallet.walletBalance)} TRX` : '-- TRX'}
            </div>
            {paymentMethod === 'wallet' && (
              <Check className="w-4 h-4 absolute right-3 top-3 text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('account')}
            className={`p-3 rounded-xl text-left text-xs transition relative backdrop-blur-xs border cursor-pointer ${
              paymentMethod === 'account'
                ? 'bg-white/20 border-white text-white font-bold ring-2 ring-white/50'
                : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/15'
            }`}
          >
            <div className="text-blue-200 text-[11px]">{t('accountBalance')}</div>
            <div className="font-bold text-white mt-1 text-sm">
              {wallet.connected ? `${formatNumber(wallet.accountBalance)} TRX` : '-- TRX'}
            </div>
            {paymentMethod === 'account' && (
              <Check className="w-4 h-4 absolute right-3 top-3 text-white" />
            )}
          </button>
        </div>

        {/* Purchase Action Button */}
        <button
          type="button"
          onClick={onPurchase}
          disabled={isSubmitting}
          className="w-full bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-600 font-extrabold py-3.5 rounded-xl text-base shadow-lg transition transform active:scale-98 cursor-pointer flex items-center justify-center space-x-2 mt-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t('processingOrder')}</span>
            </>
          ) : (
            <>
              <span>{t('purchase')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
