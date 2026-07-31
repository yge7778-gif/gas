import React, { useState } from 'react';
import { WalletInfo, Language } from '../types';
import { shortenAddress, formatNumber } from '../utils/tron';
import { RefreshCw, PlusCircle, ExternalLink, Zap, Signal, CheckCircle2 } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface WalletCardProps {
  wallet: WalletInfo;
  onOpenWalletModal: () => void;
  onRefreshWallet: () => void | Promise<void>;
  onDeposit: () => void;
  language: Language;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  onOpenWalletModal,
  onRefreshWallet,
  onDeposit,
  language,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onRefreshWallet();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <span>{t('connectWallet')}</span>
          {wallet.connected && (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.5 rounded font-mono font-medium">
              TronGrid Connected
            </span>
          )}
        </div>
        {wallet.connected && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="text-xs text-slate-700 hover:text-blue-600 font-semibold flex items-center space-x-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200/80 px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="通过 TronGrid API 实时同步链上 TRX 余额与能量/带宽"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (language === 'zh-CN' ? '同步中...' : 'Syncing...') : (language === 'zh-CN' ? '同步 TronGrid' : 'Sync TronGrid')}</span>
            </button>
            <button
              onClick={onDeposit}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 bg-blue-50 px-2.5 py-1 rounded-lg"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('depositAccount')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Column: Wallet Connection & Balances */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            {wallet.connected && wallet.address ? (
              <div className="flex items-center justify-between mb-3">
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{shortenAddress(wallet.address, 5)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="text-[11px] text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-2 py-0.5 rounded-md font-medium flex items-center space-x-1 transition disabled:opacity-50 cursor-pointer"
                    title="TronGrid API 链上同步"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? '同步中' : '同步'}</span>
                  </button>
                  <a
                    href={`https://tronscan.org/#/address/${wallet.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center space-x-0.5"
                  >
                    <span>TRONScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenWalletModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-lg mb-3 font-semibold transition shadow-2xs cursor-pointer active:scale-95"
              >
                {t('connectWallet')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <div className="text-slate-400 font-medium">{t('walletBalance')}</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5" id="walletBalance">
                {wallet.connected ? `${formatNumber(wallet.walletBalance)} TRX` : '-- TRX'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">{t('accountBalance')}</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5" id="accountBalance">
                {wallet.connected ? `${formatNumber(wallet.accountBalance)} TRX` : '-- TRX'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Energy & Bandwidth Metrics */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('availableEnergy')}</span>
              </span>
              {wallet.connected && (
                <span className="text-[10px] text-emerald-600 flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>TronGrid Live</span>
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-slate-800 my-1" id="energyRatio">
              {wallet.connected 
                ? `${formatNumber(wallet.availableEnergy)} / ${formatNumber(wallet.totalEnergy)}`
                : '-- / --'}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200/50">
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
              <span className="flex items-center space-x-1">
                <Signal className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('availableBandwidth')}</span>
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1" id="bandwidthRatio">
              {wallet.connected
                ? `${formatNumber(wallet.availableBandwidth)} / ${formatNumber(wallet.totalBandwidth)}`
                : '-- / --'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
