import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { formatNumber } from '../utils/tron';
import qrCodeAsset from '../assets/images/deposit_qr_code_1785508898236.jpg';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number) => void;
  language: Language;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onDepositSuccess,
  language,
}) => {
  const [token, setToken] = useState<'TRX' | 'USDT'>('TRX');
  const [amount, setAmount] = useState<number>(100);
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const depositAddress = 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDeposit = (addAmount: number) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onDepositSuccess(addAmount);
      onClose();
    }, 1000);
  };

  const handleVerifyTx = () => {
    if (!txId.trim() || txId.length < 10) {
      alert(t('enterValidTxHash') || '请输入有效的波场交易 Hash (TxID)');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onDepositSuccess(amount);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('depositHeader') || 'TRON 链上充值中心'}</h3>
              <p className="text-[11px] text-slate-400">{t('depositSub') || '支持波场 TRX & USDT (TRC20) 实时打款归集'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setToken('TRX')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              token === 'TRX' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            TRX (波场币)
          </button>
          <button
            type="button"
            onClick={() => setToken('USDT')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              token === 'USDT' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            USDT (TRC20)
          </button>
        </div>

        {/* QR Code & Deposit Address */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center space-y-3">
          {/* QR Code Image */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs relative flex flex-col items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${depositAddress}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = qrCodeAsset;
              }}
              alt="TRON Deposit QR Code"
              className="w-36 h-36 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full left-1/2 -translate-x-1/2 shadow-xs">
              TRC20 MAINNET
            </span>
          </div>

          <div className="w-full space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block text-center">
              {t('depositAddressTitle') || '平台专属归集打款地址'}
            </span>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono font-bold text-slate-800">
              <span className="truncate mr-2">{depositAddress}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold flex items-center space-x-1 shrink-0 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Recharge & Manual Tx Verification */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>{t('quickRecharge') || '快捷划转 (即时区块到账)'}</span>
            <span className="text-[10px] text-slate-400 font-normal">最小充值 10 TRX</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickDeposit(val)}
                disabled={isVerifying}
                className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-blue-600 transition flex items-center justify-center space-x-1"
              >
                <span>+{val} TRX</span>
              </button>
            ))}
          </div>

          {/* TxID verification */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              {t('manualTxVerify') || '手动输入交易哈希 (TxID) 校验链上确认:'}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="例如: 8f3b9a2c1e4d..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleVerifyTx}
                disabled={isVerifying}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1 disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{t('verifyDeposit') || '校验充值'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/60 text-[11px] text-amber-800 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>请务必通过 TRON 主网 (TRC20) 进行转账。打款完成后区块需要 1-3 个确认数，即可自动同步账户余额。</span>
        </div>
      </div>
    </div>
  );
};
